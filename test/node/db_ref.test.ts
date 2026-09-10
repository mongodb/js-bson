import { expect } from 'chai';
import * as BSON from '../register-bson';

import { DBRef, isDBRefLike } from '../../src/db_ref';
import { ObjectId } from '../../src/objectid';

describe('DBRef', function () {
  const oid = new ObjectId('58921b3e6e32ab156a22b59e');

  describe('constructor()', function () {
    // The DBRef spec requires $ref to be treated as an opaque string:
    // "Drivers MUST require $ref and $db (if specified) to be strings but MUST NOT
    //  enforce any naming restrictions on the string values."
    it('treats a collection name containing a dot as a literal', function () {
      const ref = new DBRef('foo.bar', oid);
      expect(ref).to.have.property('collection', 'foo.bar');
      expect(ref).to.have.property('db', undefined);
    });

    it('does not override an explicitly provided db', function () {
      const ref = new DBRef('foo.bar', oid, 'mydb');
      expect(ref).to.have.property('collection', 'foo.bar');
      expect(ref).to.have.property('db', 'mydb');
    });

    it('treats a collection name containing multiple dots as a literal', function () {
      const ref = new DBRef('foo.bar.baz', oid);
      expect(ref).to.have.property('collection', 'foo.bar.baz');
      expect(ref).to.have.property('db', undefined);
    });

    it('treats a collection name with a leading dot as a literal', function () {
      const ref = new DBRef('.bar', oid);
      expect(ref).to.have.property('collection', '.bar');
      expect(ref).to.have.property('db', undefined);
    });
  });

  describe('round tripping a dotted $ref', function () {
    it('preserves $ref and omits $db when deserializing', function () {
      const bytes = BSON.serialize({ ref: { $ref: 'foo.bar', $id: oid } });

      const result = BSON.deserialize(bytes) as { ref: DBRef };

      expect(result.ref).to.have.property('collection', 'foo.bar');
      expect(result.ref).to.have.property('db', undefined);
    });

    it('produces identical bytes when re-serialized', function () {
      const bytes = BSON.serialize({ ref: { $ref: 'foo.bar', $id: oid } });

      const roundTripped = BSON.serialize(BSON.deserialize(bytes));

      expect(roundTripped).to.deep.equal(bytes);
    });

    it('preserves $ref through an EJSON round trip', function () {
      const ejson = '{"ref":{"$ref":"foo.bar","$id":{"$oid":"58921b3e6e32ab156a22b59e"}}}';

      const roundTripped = BSON.EJSON.stringify(BSON.EJSON.parse(ejson));

      expect(roundTripped).to.equal(ejson);
    });
  });
});

describe('dbpointer tests', function () {
  it('can serialize and deserialize 0xFFFD in dbpointer name', function () {
    // 0x0C foo\0 \0\0\07 String.fromCharCode(0x41, 0x42, 0xfffd, 0x43, 0x44) 12
    const bsonSnippet = Buffer.from([
      // Size
      34, 0, 0, 0,
      // BSON type for DBPointer
      0x0c,

      // CString Label Foo
      0x66, 0x6f, 0x6f, 0,

      // Length of UTF8 string "AB\u{FFFD}CD"
      // UTF8 bytes for replacement character are: 0xef 0xbf 0xbd
      8, 0, 0, 0, 0x41, 0x42, 0xef, 0xbf, 0xbd, 0x43, 0x44, 0,

      // 12-bit pointer
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,

      // null terminator
      0
    ]);
    expect(() => BSON.deserialize(bsonSnippet)).to.not.throw();
  });

  // bson-corpus dbpointer.json specifies the upgraded form as
  // {"$ref": <namespace>, "$id": ...} with no $db, so the namespace is carried over verbatim.
  it('upgrades a dotted namespace to a DBRef without extracting a db', function () {
    const bsonSnippet = Buffer.from([
      // Size
      32, 0, 0, 0,
      // BSON type for DBPointer
      0x0c,

      // CString label "a"
      0x61, 0,

      // Length prefixed string "db.coll"
      8, 0, 0, 0, 0x64, 0x62, 0x2e, 0x63, 0x6f, 0x6c, 0x6c, 0,

      // 12-byte pointer
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,

      // null terminator
      0
    ]);

    const result = BSON.deserialize(bsonSnippet) as { a: DBRef };

    expect(result.a).to.have.property('collection', 'db.coll');
    expect(result.a).to.have.property('db', undefined);
  });

  describe('isDBRefLike()', () => {
    const table = [
      // Fail cases
      { kind: 'a null value', input: null, output: false },
      { kind: 'an undefined value', input: null, output: false },
      { kind: 'a non-object value', input: 2, output: false },
      { kind: 'an object with only a $id prop', input: { $id: '' }, output: false },
      { kind: 'an object with only a $ref prop', input: { $ref: '' }, output: false },
      {
        kind: 'an object with a $id and $ref prop but $ref is not a string',
        input: { $id: '', $ref: 2 },
        output: false
      },
      {
        kind: 'an object with a $id, $ref, and $db prop but $db is not a string',
        input: { $id: '', $ref: '', $db: 2 },
        output: false
      },

      // Success cases
      {
        kind: 'an object with a $id and $ref prop',
        input: { $id: '', $ref: '' },
        output: true
      },
      {
        kind: 'an object with a $id, $ref, and $db prop',
        input: { $id: '', $ref: '', $db: '' },
        output: true
      }
    ];

    for (const { kind, input, output } of table) {
      it(`when passed ${kind} indicates ${output ? 'is' : 'is not'} a DBRefLike`, () => {
        expect(isDBRefLike(input)).to.be[output ? 'true' : 'false'];
      });
    }
  });
});
