'use strict';

const BSON = require('../register-bson');
const BSONTypeError = BSON.BSONTypeError;

describe('BSON BigInt Support', function () {
  before(function () {
    try {
      BigInt(0);
    } catch (_) {
      this.skip('JS VM does not support BigInt');
    }
  });
  it('Should serialize an int that fits in int32', function () {
    const testDoc = { b: BigInt(32) };
    expect(() => BSON.serialize(testDoc)).to.throw(BSONTypeError);

    // const serializedDoc = BSON.serialize(testDoc);
    // // prettier-ignore
    // const resultBuffer = Buffer.from([0x0C, 0x00, 0x00, 0x00, 0x10, 0x62, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00]);
    // const resultDoc = BSON.deserialize(serializedDoc);
    // expect(Array.from(serializedDoc)).to.have.members(Array.from(resultBuffer));
    // expect(BigInt(resultDoc.b)).to.equal(testDoc.b);
  });

  it('Should serialize an int that fits in int64', function () {
    const testDoc = { b: BigInt(0x1ffffffff) };
    expect(() => BSON.serialize(testDoc)).to.throw(BSONTypeError);

    // const serializedDoc = BSON.serialize(testDoc);
    // // prettier-ignore
    // const resultBuffer = Buffer.from([0x10, 0x00, 0x00, 0x00, 0x12, 0x62, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x00]);
    // const resultDoc = BSON.deserialize(serializedDoc);
    // expect(Array.from(serializedDoc)).to.have.members(Array.from(resultBuffer));
    // expect(BigInt(resultDoc.b)).to.equal(testDoc.b);
  });

  it('Should serialize an int that fits in decimal128', function () {
    const testDoc = { b: BigInt('9223372036854776001') }; // int64 max + 1
    expect(() => BSON.serialize(testDoc)).to.throw(BSONTypeError);

    // const serializedDoc = BSON.serialize(testDoc);
    // // prettier-ignore
    // const resultBuffer = Buffer.from([0x18, 0x00, 0x00, 0x00, 0x13, 0x62, 0x00, 0xC1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x30, 0x00]);
    // const resultDoc = BSON.deserialize(serializedDoc);
    // expect(Array.from(serializedDoc)).to.have.members(Array.from(resultBuffer));
    // expect(resultDoc.b._bsontype).to.equal('Decimal128');
    // expect(BigInt(resultDoc.b.toString())).to.equal(testDoc.b);
  });

  it('Should throw if BigInt is too large to serialize', function () {
    const testDoc = {
      b: BigInt('9'.repeat(35))
    }; // decimal 128 can only encode 34 digits of precision
    expect(() => BSON.serialize(testDoc)).to.throw(BSONTypeError);
    // expect(() => BSON.serialize(testDoc)).to.throw();
  });

  it('Should accept BigInts in Long constructor', function (done) {
    const Long = BSON.Long;
    expect(new Long(BigInt('0')).toString()).to.equal('0');
    expect(new Long(BigInt('-1')).toString()).to.equal('-1');
    expect(new Long(BigInt('-1'), true).toString()).to.equal('18446744073709551615');
    expect(new Long(BigInt('123456789123456789')).toString()).to.equal('123456789123456789');
    expect(new Long(BigInt('123456789123456789'), true).toString()).to.equal('123456789123456789');
    expect(new Long(BigInt('13835058055282163712')).toString()).to.equal('-4611686018427387904');
    expect(new Long(BigInt('13835058055282163712'), true).toString()).to.equal(
      '13835058055282163712'
    );
    done();
  });
});
