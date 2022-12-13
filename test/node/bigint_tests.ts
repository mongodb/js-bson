import * as BSON from '../register-bson';
import * as byteUtils from './tools/utils';
import * as CONSTANTS from '../../src/constants';

describe('BSON BigInt Support', function () {
  // Index for the data type byte of a BSON document with a single element
  const DATA_TYPE_OFFSET = 4;
  before(function () {
    try {
      BigInt(0);
    } catch (_) {
      this.skip('JS VM does not support BigInt');
    }
  });

  it('Serializes bigints with the correct BSON type', function () {
    const testDoc = { a: 0n };
    const serializedDoc = BSON.serialize(testDoc);
    expect(serializedDoc[DATA_TYPE_OFFSET]).to.equal(CONSTANTS.BSON_DATA_LONG);
  });

  it('Serializes bigints into little-endian byte order', function () {
    const testDoc = { a: BigInt(0x1234567812345678n) };
    const serializedDoc = BSON.serialize(testDoc);
    const expectedResult = byteUtils.bufferFromHexArray([
      '12', // int64 type
      '6100', // 'a' key with key null terminator
      '7856341278563412' // little endian int64
    ]);
    expect(serializedDoc).to.deep.equal(expectedResult);
  });

  it('Correctly serializes a BigInt that fits in int32', function () {
    const testDoc = { a: BigInt(0x23) };
    const serializedDoc = BSON.serialize(testDoc);
    const expectedResult = byteUtils.bufferFromHexArray([
      '12', // int64 type
      '6100', // 'a' key with key null terminator
      '2300000000000000' // little endian int64
    ]);
    expect(serializedDoc).to.deep.equal(expectedResult);
  });

  it('Correctly serializes a BigInt that fits in int64', function () {
    const testDoc = { b: BigInt(0xfffffffffffffff1n) };
    const serializedDoc = BSON.serialize(testDoc);
    const expectedResult = byteUtils.bufferFromHexArray([
      '12', // int64
      '6200', // 'b' '\0'
      'f1ffffffffffffff'
    ]);
    expect(serializedDoc).to.deep.equal(expectedResult);
  });

  it('Correctly wraps to negative on a BigInt that is larger than (2^63 -1)', function () {
    const maxIntPlusOne = { test: 2n ** 63n };
    const serializedMaxIntPlusOne = BSON.serialize(maxIntPlusOne);
    const expectedResultForMaxIntPlusOne = byteUtils.bufferFromHexArray([
      '12', // int64
      Buffer.from('test\x00', 'utf8').toString('hex'),
      '0000000000000080'
    ]);
    expect(serializedMaxIntPlusOne).to.deep.equal(expectedResultForMaxIntPlusOne);
  });

  it('Correctly serializes bigints at the end edges of the valid range (-2^63 and 2^63 - 1)', function () {
    const maxPositiveInt64 = { test: 2n ** 63n - 1n };
    const serializedMaxPositiveInt64 = BSON.serialize(maxPositiveInt64);
    const expectedSerializationForMaxPositiveInt64 = byteUtils.bufferFromHexArray([
      '12', // int64
      Buffer.from('test\x00', 'utf8').toString('hex'),
      'ffffffffffffff7f'
    ]);
    expect(serializedMaxPositiveInt64).to.deep.equal(expectedSerializationForMaxPositiveInt64);

    const minPositiveInt64 = { test: -(2n ** 63n) };
    const serializedMinPositiveInt64 = BSON.serialize(minPositiveInt64);
    const expectedSerializationForMinPositiveInt64 = byteUtils.bufferFromHexArray([
      '12', // int64
      Buffer.from('test\x00', 'utf8').toString('hex'),
      '0000000000000080'
    ]);
    expect(serializedMinPositiveInt64).to.deep.equal(expectedSerializationForMinPositiveInt64);
  });

  it("Correctly truncates a BigInt that doesn't fit into an int64", function () {
    const testDoc = { test: 2n ** 64n + 1n };
    const serializedDoc = BSON.serialize(testDoc);
    const expectedSerialization = byteUtils.bufferFromHexArray([
      '12', //int64
      Buffer.from('test\x00', 'utf8').toString('hex'),
      '0100000000000000'
    ]);
    expect(serializedDoc).to.deep.equal(expectedSerialization);
  });

  it('Should accept BigInts in Long constructor', function () {
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
  });
});
