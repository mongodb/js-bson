import * as BSON from '../../register-bson';
import { expect } from 'chai';
import { bufferFromHexArray, int32LEToHex } from '../tools/utils';
import { utf8WebPlatformSpecTests } from '../data/utf8_wpt_error_cases';

describe('deserializer()', () => {
  describe('basic deserialization', () => {
    it('deserializes a simple document', () => {
      const bytes = BSON.serialize({ hello: 'world' });
      const result = BSON.deserialize(bytes);
      expect(result).to.deep.equal({ hello: 'world' });
    });

    it('can deserialize a document with an array of objects', () => {
      const bytes = BSON.serialize({ a: [{ b: 1 }, { c: 2 }] });
      const result = BSON.deserialize(bytes);
      expect(result).to.deep.equal({ a: [{ b: 1 }, { c: 2 }] });
    });

    it('converts a root-level DBRef-shaped document to a DBRef instance', () => {
      const oid = new BSON.ObjectId();
      const bytes = BSON.serialize({ $ref: 'ns', $id: oid, $db: 'db' });
      const result = BSON.deserialize(bytes);
      expect(result).to.have.property('_bsontype', 'DBRef');
      expect(result).to.have.property('collection', 'ns');
      expect(result).to.have.property('db', 'db');
      expect((result as BSON.DBRef).oid.toHexString()).to.equal(oid.toHexString());
    });

    it('preserves extra fields in DBRef.fields and excludes $ref/$id/$db from them', () => {
      const oid = new BSON.ObjectId();
      const bytes = BSON.serialize({ $ref: 'ns', $id: oid, $db: 'db', extra: 'value', num: 42 });
      const result = BSON.deserialize(bytes) as BSON.DBRef;
      expect(result).to.have.property('_bsontype', 'DBRef');
      expect(result.fields).to.deep.equal({ extra: 'value', num: 42 });
      expect(result.fields).to.not.have.property('$ref');
      expect(result.fields).to.not.have.property('$id');
      expect(result.fields).to.not.have.property('$db');
    });

    it('produces an empty fields object when a DBRef-shaped document has no extra fields', () => {
      const oid = new BSON.ObjectId();
      const bytes = BSON.serialize({ $ref: 'ns', $id: oid, $db: 'db' });
      const result = BSON.deserialize(bytes) as BSON.DBRef;
      expect(result).to.have.property('_bsontype', 'DBRef');
      expect(result.fields).to.deep.equal({});
    });

  });

  describe('when the fieldsAsRaw options is present and has a value that corresponds to a key in the object', () => {
    it('ignores non-own properties set on the options object', () => {
      const bytes = BSON.serialize({ someKey: [1] });
      const options = { fieldsAsRaw: { someKey: true } };
      Object.setPrototypeOf(options, { promoteValues: false });
      const result = BSON.deserialize(bytes, options);
      expect(result).to.have.property('someKey').that.is.an('array');
      expect(
        result.someKey[0],
        'expected promoteValues option set on options object prototype to be ignored, but it was not'
      ).to.not.have.property('_bsontype', 'Int32');
    });
  });

  describe('Code with Scope', () => {
    it('round-trips a simple scope', () => {
      const original = new BSON.Code('function() {}', { x: 1, y: 'hello' });
      const { code } = BSON.deserialize(BSON.serialize({ code: original }));
      expect(code).to.have.property('_bsontype', 'Code');
      expect(code.scope).to.deep.equal({ x: 1, y: 'hello' });
    });

    it('keeps a DBRef-shaped scope as a plain object', () => {
      const oid = new BSON.ObjectId();
      const scope = { $ref: 'col', $id: oid, $db: 'db' };
      const original = new BSON.Code('function () {}', scope);
      const { code } = BSON.deserialize(BSON.serialize({ code: original }));
      expect(code).to.have.property('_bsontype', 'Code');
      expect(code.scope).to.not.have.property('_bsontype');
      expect(code.scope).to.have.property('$ref', 'col');
      expect(code.scope).to.have.property('$db', 'db');
      expect(code.scope.$id).to.be.instanceOf(BSON.ObjectId);
      expect(code.scope.$id.toHexString()).to.equal(oid.toHexString());
    });
  });

  describe('when passing an evalFunctions option', () => {
    const codeTypeBSON = bufferFromHexArray([
      '0D', // javascript type
      '6100', // 'a\x00'
      // 29 chars + null byte
      '1E000000',
      Buffer.from('function iLoveJavascript() {}\x00', 'utf8').toString('hex')
    ]);
    const codeWithScopeTypeBSON = bufferFromHexArray([
      '0F', // javascript code with scope type
      '6100', // 'a\x00'

      // Code with scope size, we don't have a hex helper here so this is
      // 29 bytes for the code + 1 null byte
      // 4 bytes for the code with scope total size
      // 4 bytes for the string size
      // 9 bytes for the scope doc
      // (29 + 1 + 4 + 4 + 9).toString(16)
      '2F000000',
      // 29 chars + null byte
      '1E000000',
      Buffer.from('function iLoveJavascript() {}\x00', 'utf8').toString('hex'),
      bufferFromHexArray(['08', '6200', '01']).toString('hex') // scope: { b: true }
    ]);

    it('only returns Code instances', () => {
      // @ts-expect-error: Checking removed options
      const resultCode = BSON.deserialize(codeTypeBSON, { evalFunctions: true });
      expect(resultCode).to.have.nested.property('a._bsontype', 'Code');
      expect(resultCode).to.have.nested.property('a.code', 'function iLoveJavascript() {}');

      // @ts-expect-error: Checking removed options
      const resultCodeWithScope = BSON.deserialize(codeWithScopeTypeBSON, { evalFunctions: true });
      expect(resultCodeWithScope).to.have.nested.property('a._bsontype', 'Code');
      expect(resultCodeWithScope).to.have.nested.property(
        'a.code',
        'function iLoveJavascript() {}'
      );
      expect(resultCodeWithScope).to.have.deep.nested.property('a.scope', { b: true });
    });
  });

  describe('when deserializing deeply nested documents', () => {
    it('can deserialize a document with 20,000 nesting levels', () => {
      // Build a valid BSON buffer iteratively to avoid hitting the serializer's own recursion limit.
      // Each level wraps the previous in { a: <nested> }.
      let inner = Buffer.from([0x05, 0x00, 0x00, 0x00, 0x00]); // innermost: empty doc {}

      for (let i = 0; i < 20_000; i++) {
        // doc layout: [int32 size][0x03 type]['a\0' key][nested doc][0x00 terminator]
        const docSize = 4 + 1 + 2 + inner.length + 1;
        const doc = Buffer.allocUnsafe(docSize);
        let offset = 0;
        doc.writeInt32LE(docSize, 0);
        offset += 4;
        doc[offset++] = 0x03; // BSON_DATA_OBJECT
        doc[offset++] = 0x61; // 'a'
        doc[offset++] = 0x00; // key null terminator
        inner.copy(doc, offset);
        offset += inner.length;
        doc[offset] = 0x00; // document null terminator
        inner = doc;
      }

      expect(() => BSON.deserialize(inner)).to.not.throw();
    });

    it('can deserialize a document with 20,000 levels of nested arrays', () => {
      // Same technique as the object nesting test but with 0x04 (array) type and '0' index keys.
      let inner = Buffer.from([0x05, 0x00, 0x00, 0x00, 0x00]); // innermost: empty array []

      for (let i = 0; i < 20_000; i++) {
        // array doc layout: [int32 size][0x04 type]['0\0' key][nested array][0x00 terminator]
        const docSize = 4 + 1 + 2 + inner.length + 1;
        const doc = Buffer.allocUnsafe(docSize);
        let offset = 0;
        doc.writeInt32LE(docSize, 0);
        offset += 4;
        doc[offset++] = 0x04; // BSON_DATA_ARRAY
        doc[offset++] = 0x30; // '0'
        doc[offset++] = 0x00; // key null terminator
        inner.copy(doc, offset);
        offset += inner.length;
        doc[offset] = 0x00; // document null terminator
        inner = doc;
      }

      expect(() => BSON.deserialize(inner)).to.not.throw();
    });

    it('can deserialize a code-with-scope whose scope is 20,000 levels deep', () => {
      // Build a deeply nested scope document (same technique as the object nesting test).
      let scope = Buffer.from([0x05, 0x00, 0x00, 0x00, 0x00]); // innermost: empty doc {}
      for (let i = 0; i < 20_000; i++) {
        const docSize = 4 + 1 + 2 + scope.length + 1;
        const doc = Buffer.allocUnsafe(docSize);
        let offset = 0;
        doc.writeInt32LE(docSize, 0);
        offset += 4;
        doc[offset++] = 0x03; // BSON_DATA_OBJECT
        doc[offset++] = 0x61; // 'a'
        doc[offset++] = 0x00;
        scope.copy(doc, offset);
        offset += scope.length;
        doc[offset] = 0x00;
        scope = doc;
      }

      // Wrap the scope in a code-with-scope element at the root.
      // code-with-scope value layout (BSON spec):
      //   [int32 total_size][int32 string_size][string_bytes][0x00][scope_document]
      //   total_size = 4 (total_size field) + 4 (string_size field) + string_size + scope.length
      const stringSize = 1; // empty string: just the null terminator
      const cwsTotalSize = 4 + 4 + stringSize + scope.length;
      // outer doc: [int32 size][0x0F]['a\0'][cws bytes][0x00 terminator]
      const docSize = 4 + 1 + 2 + cwsTotalSize + 1;
      const doc = Buffer.allocUnsafe(docSize);
      let offset = 0;
      doc.writeInt32LE(docSize, offset);
      offset += 4;
      doc[offset++] = 0x0f; // BSON_DATA_CODE_W_SCOPE
      doc[offset++] = 0x61; // 'a'
      doc[offset++] = 0x00;
      doc.writeInt32LE(cwsTotalSize, offset);
      offset += 4;
      doc.writeInt32LE(stringSize, offset);
      offset += 4;
      doc[offset++] = 0x00; // empty function string null terminator
      scope.copy(doc, offset);
      offset += scope.length;
      doc[offset] = 0x00; // document null terminator

      expect(() => BSON.deserialize(doc)).to.not.throw();
    });

    it('round-trips a deeply nested document without data loss', () => {
      // Use moderate depth so BSON.serialize can handle it, while verifying the iterative
      // deserializer reconstructs the structure correctly (not just "doesn't throw").
      let obj: Record<string, unknown> = { leaf: 'value' };
      for (let i = 0; i < 100; i++) {
        obj = { a: obj };
      }
      const result = BSON.deserialize(BSON.serialize(obj));
      expect(result).to.deep.equal(obj);
    });
  });

  describe('corrupted BSON error messages', () => {
    it('throws "corrupted array bson" for a nested array with a wrong size field', () => {
      // Serialize a valid { a: [1] } document, then corrupt the nested array's size field
      // so the terminator is reached before the declared end of the array.
      const valid = Buffer.from(BSON.serialize({ a: [new BSON.Int32(1)] }));
      // The array size field is at byte 7: [outer size(4)] [type(1)] [key 'a\0'(2)] [array size(4)...]
      const arraySizeOffset = 7;
      valid.writeInt32LE(valid.readInt32LE(arraySizeOffset) + 1, arraySizeOffset);
      expect(() => BSON.deserialize(valid)).to.throw(BSON.BSONError, 'corrupted array bson');
    });

    it('throws "corrupted array bson" for an array nested inside a nested object', () => {
      // Regression: before the fix, deeply nested arrays threw 'Bad BSON Document: object not properly terminated'
      // because the frame-level mismatch check did not distinguish array frames from object frames.
      // { a: { b: [1] } } — the array is two levels deep, so two frames are on the stack when the
      // mismatch is detected.
      // Layout: [root size(4)][0x03 type(1)]['a\0'(2)][obj size(4)][0x04 type(1)]['b\0'(2)][arr size(4)...]
      //          ^0                                                                           ^14
      const valid = Buffer.from(BSON.serialize({ a: { b: [new BSON.Int32(1)] } }));
      const innerArraySizeOffset = 14;
      valid.writeInt32LE(valid.readInt32LE(innerArraySizeOffset) + 1, innerArraySizeOffset);
      expect(() => BSON.deserialize(valid)).to.throw(BSON.BSONError, 'corrupted array bson');
    });

    it('throws "corrupted array bson" for an array nested inside another array', () => {
      // Regression: same fix as above — when the inner array of { a: [[1]] } has a wrong size,
      // the parser must still throw 'corrupted array bson', not the generic object-terminator error.
      // Layout: [root size(4)][0x04 type(1)]['a\0'(2)][outer arr size(4)][0x04 type(1)]['0\0'(2)][inner arr size(4)...]
      //          ^0                                                                                 ^14
      const valid = Buffer.from(BSON.serialize({ a: [[new BSON.Int32(1)]] }));
      const innerArraySizeOffset = 14;
      valid.writeInt32LE(valid.readInt32LE(innerArraySizeOffset) + 1, innerArraySizeOffset);
      expect(() => BSON.deserialize(valid)).to.throw(BSON.BSONError, 'corrupted array bson');
    });

    it('throws "bad embedded array length in bson" for a nested array with size zero', () => {
      const valid = Buffer.from(BSON.serialize({ a: [new BSON.Int32(1)] }));
      // byte 7: [outer size(4)] [type(1)] [key 'a\0'(2)] → array size field
      const arraySizeOffset = 7;
      valid.writeInt32LE(0, arraySizeOffset);
      expect(() => BSON.deserialize(valid)).to.throw(
        BSON.BSONError,
        'bad embedded array length in bson'
      );
    });

    it('throws "bad embedded array length in bson" for a nested array with a negative size', () => {
      const valid = Buffer.from(BSON.serialize({ a: [new BSON.Int32(1)] }));
      const arraySizeOffset = 7;
      valid.writeInt32LE(-1, arraySizeOffset);
      expect(() => BSON.deserialize(valid)).to.throw(
        BSON.BSONError,
        'bad embedded array length in bson'
      );
    });

    it('throws "bad embedded array length in bson" for a nested array whose size exceeds the buffer', () => {
      const valid = Buffer.from(BSON.serialize({ a: [new BSON.Int32(1)] }));
      const arraySizeOffset = 7;
      valid.writeInt32LE(valid.length + 1, arraySizeOffset);
      expect(() => BSON.deserialize(valid)).to.throw(
        BSON.BSONError,
        'bad embedded array length in bson'
      );
    });
  });

  describe('utf8 validation', () => {
    for (const test of utf8WebPlatformSpecTests) {
      const inputStringSize = int32LEToHex(test.input.length + 1); // int32 size of string
      const inputHexString = Buffer.from(test.input).toString('hex');
      const buffer = bufferFromHexArray([
        '02', // string
        '6100', // 'a' key with null terminator
        inputStringSize,
        inputHexString,
        '00'
      ]);
      context(`when utf8 validation is on and input is ${test.name}`, () => {
        it(`throws error containing 'Invalid UTF-8'`, () => {
          // global case
          expect(() => BSON.deserialize(buffer, { validation: { utf8: true } })).to.throw(
            BSON.BSONError,
            /Invalid UTF-8 string in BSON document/i
          );

          // specific case
          expect(() => BSON.deserialize(buffer, { validation: { utf8: { a: true } } })).to.throw(
            BSON.BSONError,
            /Invalid UTF-8 string in BSON document/i
          );
        });
      });

      context(`when utf8 validation is off and input is ${test.name}`, () => {
        it('returns a string containing at least 1 replacement character', () => {
          // global case
          expect(BSON.deserialize(buffer, { validation: { utf8: false } }))
            .to.have.property('a')
            .that.includes('\uFFFD');

          // specific case
          expect(BSON.deserialize(buffer, { validation: { utf8: { a: false } } }))
            .to.have.property('a')
            .that.includes('\uFFFD');
        });
      });
    }
  });
});
