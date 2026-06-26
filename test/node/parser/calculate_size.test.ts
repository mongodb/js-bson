import * as BSON from '../../register-bson';
import { expect } from 'chai';
import { BSONVersionError } from '../../register-bson';
import { buildDeeplyNestedObject } from '../tools/utils';

describe('calculateSize()', () => {
  it('should only enumerate own property keys from input objects', () => {
    const input = { a: 1 };
    Object.setPrototypeOf(input, { b: 2 });
    expect(BSON.calculateObjectSize(input)).to.equal(12);
  });

  it(`throws if Symbol.for('@@mdb.bson.version') is the wrong version`, () => {
    expect(() =>
      BSON.calculateObjectSize({
        a: { _bsontype: 'Int32', value: 2, [Symbol.for('@@mdb.bson.version')]: 1 }
      })
    ).to.throw(BSONVersionError, /Unsupported BSON version/i);
  });

  it(`throws if Symbol.for('@@mdb.bson.version') is not defined`, () => {
    expect(() =>
      BSON.calculateObjectSize({
        a: { _bsontype: 'Int32', value: 2 }
      })
    ).to.throw(BSONVersionError, /Unsupported BSON version/i);
  });

  describe('when calculating size of deeply nested documents', () => {
    it('can calculate the size of a document with 20,000 nesting levels without a stack overflow', () => {
      const size = BSON.calculateObjectSize(buildDeeplyNestedObject(20_000));
      expect(size).to.be.greaterThan(0);
    });
  });

  describe('when given a bigint value with a single character key', function () {
    it('returns 8 bytes (+4 bytes for document size + 1 type byte + 1 byte for "a" + 2 null terminators)', function () {
      const doc = { a: 1n };
      expect(BSON.calculateObjectSize(doc)).to.equal(8 + 4 + 1 + 1 + 1 + 1);
      expect(BSON.calculateObjectSize(doc)).to.equal(BSON.serialize(doc).byteLength);
    });
  });

  describe('when given a symbol value with a single character key', function () {
    it('returns 0 bytes (+4 bytes for document size + 1 null terminator)', function () {
      const doc = { a: Symbol() };
      expect(BSON.calculateObjectSize(doc)).to.equal(4 + 1);
      expect(BSON.calculateObjectSize(doc)).to.equal(BSON.serialize(doc).byteLength);
    });
  });

  describe('when given an Int32 value with a single character key', function () {
    it('returns 12 bytes (+4 bytes for document size + 1 type byte + 1 byte for "a" + 4 bytes int32 + 2 null terminators)', function () {
      const doc = { a: new BSON.Int32(2) };
      expect(BSON.calculateObjectSize(doc)).to.equal(4 + 1 + 1 + 4 + 1 + 1);
      expect(BSON.calculateObjectSize(doc)).to.equal(BSON.serialize(doc).byteLength);
    });
  });

  describe('when given an array of Int32 values', function () {
    it('matches the serialized byte length', function () {
      const doc = { a: [new BSON.Int32(1), new BSON.Int32(2)] };
      expect(BSON.calculateObjectSize(doc)).to.equal(BSON.serialize(doc).byteLength);
    });
  });

  describe('when given an Int32 value nested in a subdocument', function () {
    it('matches the serialized byte length', function () {
      const doc = { a: { b: new BSON.Int32(1) } };
      expect(BSON.calculateObjectSize(doc)).to.equal(BSON.serialize(doc).byteLength);
    });
  });

  describe('when given a BSONSymbol value with a single character key', function () {
    it('returns the exact byte count (+4 bytes for document size + 1 type byte + 1 byte for "a" + 4 bytes string length + 4 bytes "sym\\0" + 2 null terminators)', function () {
      const doc = { a: new BSON.BSONSymbol('sym') };
      expect(BSON.calculateObjectSize(doc)).to.equal(4 + 1 + 1 + 4 + 4 + 1 + 1);
      expect(BSON.calculateObjectSize(doc)).to.equal(BSON.serialize(doc).byteLength);
    });
  });
});
