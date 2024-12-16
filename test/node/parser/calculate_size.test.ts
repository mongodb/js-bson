import * as BSON from '../../register-bson';
import { expect } from 'chai';
import { BSONVersionError } from '../../register-bson';

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

  describe('when given a bigint value with a single character key', function () {
    beforeEach(function () {
      if (BSON.__noBigInt__) {
        this.currentTest?.skip();
      }
    });

    it('returns 8 bytes (+4 bytes for document size + 1 type byte + 1 byte for "a" + 2 null terminators)', function () {
      const doc = { a: BigInt(1) };
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
});
