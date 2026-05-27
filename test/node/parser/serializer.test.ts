import * as BSON from '../../register-bson';
import { bufferFromHexArray } from '../tools/utils';
import { expect } from 'chai';
import { BSONVersionError } from '../../register-bson';

function buildDeeplyNestedObject(depth: number): Record<string, unknown> {
  let inner: Record<string, unknown> = {};
  for (let i = 0; i < depth; i++) {
    inner = { a: inner };
  }
  return inner;
}

function buildDeeplyNestedArray(depth: number): unknown[] {
  let inner: unknown[] = [];
  for (let i = 0; i < depth; i++) {
    inner = [inner];
  }
  return inner;
}

describe('serialize()', () => {
  it('should only enumerate own property keys from input objects', () => {
    const input = { a: 1 };
    Object.setPrototypeOf(input, { b: 2 });
    const bytes = BSON.serialize(input);
    expect(bytes).to.deep.equal(
      bufferFromHexArray([
        '106100', // type int32, a\x00
        '01000000' // int32LE = 1
      ])
    );
  });

  it('returns an empty document when the root input is nullish', () => {
    // @ts-expect-error: Testing nullish input, not supported by type defs but code works gracefully
    const emptyDocumentUndef = BSON.serialize(undefined);
    expect(emptyDocumentUndef).to.deep.equal(new Uint8Array([5, 0, 0, 0, 0]));
    // @ts-expect-error: Testing nullish input, not supported by type defs but code works gracefully
    const emptyDocumentNull = BSON.serialize(null);
    expect(emptyDocumentNull).to.deep.equal(new Uint8Array([5, 0, 0, 0, 0]));
  });

  it('does not turn nested nulls into empty documents', () => {
    // In JS typeof null is 'object' so it is possible it could be misinterpreted as an object with no keys
    const nestedNull = bufferFromHexArray([
      '0A', // null type
      '6100', // 'a\x00'
      '' // null is encoded as nothing
    ]);
    const emptyDocumentUndef = BSON.serialize({ a: undefined }, { ignoreUndefined: false });
    expect(emptyDocumentUndef).to.deep.equal(nestedNull);
    const emptyDocumentNull = BSON.serialize({ a: null });
    expect(emptyDocumentNull).to.deep.equal(nestedNull);
  });

  describe('when serializing deeply nested documents', () => {
    it('can serialize a document with 20,000 nesting levels without a stack overflow', () => {
      // Calling serialize directly: if it throws, mocha fails the test.
      // Avoids expect().to.not.throw() which is silently swallowed by the register-bson chai plugin.
      // Use byteLength (not instanceof) — instanceof fails across vm.createContext in WEB mode.
      const result = BSON.serialize(buildDeeplyNestedObject(20_000));
      expect(result.byteLength).to.be.greaterThan(0);
    });

    it('produces valid BSON after deserializing and re-serializing a deeply nested document', () => {
      // Build the BSON buffer the same iterative way the deserializer test does,
      // bypassing the serializer's own recursion limit to get a deeply nested BSON buffer.
      let inner = Buffer.from([0x05, 0x00, 0x00, 0x00, 0x00]); // empty doc {}
      for (let i = 0; i < 20_000; i++) {
        const docSize = 4 + 1 + 2 + inner.length + 1;
        const doc = Buffer.allocUnsafe(docSize);
        let offset = 0;
        doc.writeInt32LE(docSize, 0);
        offset += 4;
        doc[offset++] = 0x03; // BSON_DATA_OBJECT
        doc[offset++] = 0x61; // 'a'
        doc[offset++] = 0x00;
        inner.copy(doc, offset);
        offset += inner.length;
        doc[offset] = 0x00;
        inner = doc;
      }
      const obj = BSON.deserialize(inner);
      const result = BSON.serialize(obj);
      expect(result.byteLength).to.be.greaterThan(0);
    });

    it('can serialize a document containing a deeply nested array without a stack overflow', () => {
      const result = BSON.serialize({ a: buildDeeplyNestedArray(20_000) });
      expect(result.byteLength).to.be.greaterThan(0);
    });
  });

  describe('DBRef serialization consistency with calculateObjectSize', () => {
    for (const [label, db] of [
      ['empty string db', ''],
      ['defined db', 'mydb'],
      ['undefined db', undefined]
    ] as const) {
      it(`calculateObjectSize matches serialize byte count for DBRef with ${label}`, () => {
        const dbref = new BSON.DBRef('users', new BSON.ObjectId(), db);
        const doc = { ref: dbref };
        expect(BSON.calculateObjectSize(doc)).to.equal(BSON.serialize(doc).byteLength);
      });
    }
  });

  describe('validates input types', () => {
    it('does not permit arrays as the root input', () => {
      expect(() => BSON.serialize([])).to.throw(/does not support an array/);
    });

    it('does not permit objects with a _bsontype string to be serialized at the root', () => {
      expect(() => BSON.serialize({ _bsontype: 'iLoveJavascript' })).to.throw(/BSON types cannot/);
      // a nested invalid _bsontype throws something different
      expect(() =>
        BSON.serialize({
          a: { _bsontype: 'iLoveJavascript', [Symbol.for('@@mdb.bson.version')]: 7 }
        })
      ).to.throw(/invalid _bsontype/);
    });

    it('does permit objects with a _bsontype prop that is not a string', () => {
      const expected = bufferFromHexArray([
        '10', // int32
        Buffer.from('_bsontype\x00', 'utf8').toString('hex'),
        '02000000'
      ]);
      const result = BSON.serialize({ _bsontype: 2 });
      expect(result).to.deep.equal(expected);

      expect(() => BSON.serialize({ _bsontype: true })).to.not.throw();
      expect(() => BSON.serialize({ _bsontype: /a/ })).to.not.throw();
      expect(() => BSON.serialize({ _bsontype: new Date() })).to.not.throw();
    });

    it('does not permit non-objects as the root input', () => {
      // @ts-expect-error: Testing invalid input
      expect(() => BSON.serialize(true)).to.throw(/does not support non-object/);
      // @ts-expect-error: Testing invalid input
      expect(() => BSON.serialize(2)).to.throw(/does not support non-object/);
      // @ts-expect-error: Testing invalid input
      expect(() => BSON.serialize(2n)).to.throw(/does not support non-object/);
      // @ts-expect-error: Testing invalid input
      expect(() => BSON.serialize(Symbol())).to.throw(/does not support non-object/);
      // @ts-expect-error: Testing invalid input
      expect(() => BSON.serialize('')).to.throw(/does not support non-object/);
      expect(() =>
        BSON.serialize(function () {
          // ignore
        })
      ).to.throw(/does not support non-object/);
    });

    it('does not permit certain objects that are typically values as the root input', () => {
      expect(() => BSON.serialize(new Date())).to.throw(/cannot be BSON documents/);
      expect(() => BSON.serialize(/a/)).to.throw(/cannot be BSON documents/);
      expect(() => BSON.serialize(new ArrayBuffer(2))).to.throw(/cannot be BSON documents/);
      expect(() => BSON.serialize(Buffer.alloc(2))).to.throw(/cannot be BSON documents/);
      expect(() => BSON.serialize(new Uint8Array(3))).to.throw(/cannot be BSON documents/);
    });

    it(`throws if Symbol.for('@@mdb.bson.version') is the wrong version`, () => {
      expect(() =>
        BSON.serialize({
          a: { _bsontype: 'Int32', value: 2, [Symbol.for('@@mdb.bson.version')]: 1 }
        })
      ).to.throw(BSONVersionError, /Unsupported BSON version/i);
    });

    it(`throws if Symbol.for('@@mdb.bson.version') is not defined`, () => {
      expect(() =>
        BSON.serialize({
          a: { _bsontype: 'Int32', value: 2 }
        })
      ).to.throw(BSONVersionError, /Unsupported BSON version/i);
    });
  });
});
