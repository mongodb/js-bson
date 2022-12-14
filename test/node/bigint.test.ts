import { BSON } from '../register-bson';
import { bufferFromHexArray } from './tools/utils';
import { BSON_DATA_LONG } from '../../src/constants';

describe('BSON BigInt serialization Support', function () {
  // Index for the data type byte of a BSON document with a single element
  const DATA_TYPE_OFFSET = 4;

  it('Serializes bigints with the correct BSON type', function () {
    const testDoc = { a: 0n };
    const serializedDoc = BSON.serialize(testDoc);
    expect(serializedDoc[DATA_TYPE_OFFSET]).to.equal(BSON_DATA_LONG);
  });

  it('Serializes bigints into little-endian byte order', function () {
    const testDoc = { a: 0x1234567812345678n };
    const serializedDoc = BSON.serialize(testDoc);
    const expectedResult = bufferFromHexArray([
      '12', // int64 type
      '6100', // 'a' key with key null terminator
      '7856341278563412'
    ]);
    expect(serializedDoc).to.deep.equal(expectedResult);
  });

  it('Correctly serializes a BigInt that can be safely represented as a Number', function () {
    const testDoc = { a: 0x23n };
    const serializedDoc = BSON.serialize(testDoc);
    const expectedResult = bufferFromHexArray([
      '12', // int64 type
      '6100', // 'a' key with key null terminator
      '2300000000000000' // little endian int64
    ]);
    expect(serializedDoc).to.deep.equal(expectedResult);
  });

  it('Correctly serializes a BigInt in the valid range [-2^63, 2^63 - 1]', function () {
    const testDoc = { a: 0xfffffffffffffff1n };
    const serializedDoc = BSON.serialize(testDoc);
    const expectedResult = bufferFromHexArray([
      '12', // int64
      '6100', // 'a' key with key null terminator
      'f1ffffffffffffff'
    ]);
    expect(serializedDoc).to.deep.equal(expectedResult);
  });

  it('Correctly wraps to negative on a BigInt that is larger than (2^63 -1)', function () {
    const maxIntPlusOne = { a: 2n ** 63n };
    const serializedMaxIntPlusOne = BSON.serialize(maxIntPlusOne);
    const expectedResultForMaxIntPlusOne = bufferFromHexArray([
      '12', // int64
      '6100', // 'a' key with key null terminator
      '0000000000000080'
    ]);
    expect(serializedMaxIntPlusOne).to.deep.equal(expectedResultForMaxIntPlusOne);
  });

  it('Correctly serializes BigInts at the edges of the valid range [-2^63, 2^63 - 1]', function () {
    const maxPositiveInt64 = { a: 2n ** 63n - 1n };
    const serializedMaxPositiveInt64 = BSON.serialize(maxPositiveInt64);
    const expectedSerializationForMaxPositiveInt64 = bufferFromHexArray([
      '12', // int64
      '6100', // 'a' key with key null terminator
      'ffffffffffffff7f'
    ]);
    expect(serializedMaxPositiveInt64).to.deep.equal(expectedSerializationForMaxPositiveInt64);

    const minPositiveInt64 = { a: -(2n ** 63n) };
    const serializedMinPositiveInt64 = BSON.serialize(minPositiveInt64);
    const expectedSerializationForMinPositiveInt64 = bufferFromHexArray([
      '12', // int64
      '6100', // 'a' key with key null terminator
      '0000000000000080'
    ]);
    expect(serializedMinPositiveInt64).to.deep.equal(expectedSerializationForMinPositiveInt64);
  });

  it('Correctly truncates a BigInt that is larger than a 64-bit int', function () {
    const testDoc = { a: 2n ** 64n + 1n };
    const serializedDoc = BSON.serialize(testDoc);
    const expectedSerialization = bufferFromHexArray([
      '12', //int64
      '6100', // 'a' key with key null terminator
      '0100000000000000'
    ]);
    expect(serializedDoc).to.deep.equal(expectedSerialization);
  });
});
