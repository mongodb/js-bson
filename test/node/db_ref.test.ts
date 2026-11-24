import { expect } from 'chai';
import * as BSON from '../register-bson';

import { isDBRefLike } from '../../src/db_ref';

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

  describe('a field named __proto__', () => {
    const ejson = '{"r":{"$ref":"c","$id":1,"__proto__":{"isAdmin":true}}}';

    it('stays an own key of fields in EJSON.parse', () => {
      const dbref = BSON.EJSON.parse(ejson).r;
      expect(dbref).to.be.instanceOf(BSON.DBRef);
      expect(Object.getPrototypeOf(dbref.fields)).to.equal(Object.prototype);
      expect(Object.keys(dbref.fields)).to.deep.equal(['__proto__']);
      expect(dbref.fields.isAdmin).to.be.undefined;
    });

    it('stays a field in EJSON.stringify', () => {
      const dbref = BSON.EJSON.parse(ejson).r;
      expect(JSON.parse(BSON.EJSON.stringify({ r: dbref }))).to.deep.equal(JSON.parse(ejson));
    });

    it('stays a field in toJSON', () => {
      const dbref = BSON.EJSON.parse(ejson).r;
      const json = dbref.toJSON();
      expect(Object.getPrototypeOf(json)).to.equal(Object.prototype);
      expect(Object.keys(json)).to.deep.equal(['$ref', '$id', '__proto__']);
    });

    it('stays a field in a BSON round trip', () => {
      const fields = JSON.parse('{"__proto__":{"isAdmin":true}}');
      const doc = { r: new BSON.DBRef('c', new BSON.ObjectId(), undefined, fields) };
      const bytes = BSON.serialize(doc);
      expect(bytes.byteLength).to.equal(BSON.calculateObjectSize(doc));
      const dbref = BSON.deserialize(bytes).r;
      expect(dbref).to.be.instanceOf(BSON.DBRef);
      expect(Object.getPrototypeOf(dbref.fields)).to.equal(Object.prototype);
      expect(Object.keys(dbref.fields)).to.deep.equal(['__proto__']);
      expect(dbref.fields.isAdmin).to.be.undefined;
    });
  });
});
