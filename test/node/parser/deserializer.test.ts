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
