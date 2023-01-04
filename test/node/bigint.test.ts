import { BSON } from '../register-bson';
import { bufferFromHexArray } from './tools/utils';
import { BSON_DATA_LONG } from '../../src/constants';
import { BSONDataView } from '../../src/utils/byte_utils';

describe('BSON BigInt serialization Support', function () {
  // Index for the data type byte of a BSON document with a
  // NOTE: These offsets only apply for documents with the shape {a : <n>}
  // where n is a BigInt
  type SerializedDocParts = {
    dataType: number;
    key: string;
    value: bigint;
  };
  /**
   * NOTE: this function operates on serialized BSON documents with the shape { <key> : <n> }
   * where n is some int64. This function assumes that keys are properly encoded
   * with the necessary null byte at the end and only at the end of the key string
   */
  function getSerializedDocParts(serializedDoc: Uint8Array): SerializedDocParts {
    const DATA_TYPE_OFFSET = 4;
    const KEY_OFFSET = 5;

    const dataView = BSONDataView.fromUint8Array(serializedDoc);
    const keySlice = serializedDoc.slice(KEY_OFFSET);

    let keyLength = 0;
    while (keySlice[keyLength++] !== 0);

    const valueOffset = KEY_OFFSET + keyLength;
    const key = Buffer.from(serializedDoc.slice(KEY_OFFSET, KEY_OFFSET + keyLength)).toString(
      'utf8'
    );

    return {
      dataType: dataView.getInt8(DATA_TYPE_OFFSET),
      key: key.slice(0, keyLength - 1),
      value: dataView.getBigInt64(valueOffset, true)
    };
  }

  it('serializes bigints with the correct BSON type', function () {
    const testDoc = { a: 0n };
    const serializedDoc = getSerializedDocParts(BSON.serialize(testDoc));
    expect(serializedDoc.dataType).to.equal(BSON_DATA_LONG);
  });

  it('serializes bigints into little-endian byte order', function () {
    const testDoc = { a: 0x1234567812345678n };
    const serializedDoc = getSerializedDocParts(BSON.serialize(testDoc));
    const expectedResult = getSerializedDocParts(
      bufferFromHexArray([
        '12', // int64 type
        '6100', // 'a' key with null terminator
        '7856341278563412'
      ])
    );

    expect(expectedResult.value).to.equal(serializedDoc.value);
  });

  it('serializes a BigInt that can be safely represented as a Number', function () {
    const testDoc = { a: 0x23n };
    const serializedDoc = getSerializedDocParts(BSON.serialize(testDoc));
    const expectedResult = getSerializedDocParts(
      bufferFromHexArray([
        '12', // int64 type
        '6100', // 'a' key with null terminator
        '2300000000000000' // little endian int64
      ])
    );
    expect(serializedDoc).to.deep.equal(expectedResult);
  });

  it('serializes a BigInt in the valid range [-2^63, 2^63 - 1]', function () {
    const testDoc = { a: 0xfffffffffffffff1n };
    const serializedDoc = getSerializedDocParts(BSON.serialize(testDoc));
    const expectedResult = getSerializedDocParts(
      bufferFromHexArray([
        '12', // int64
        '6100', // 'a' key with null terminator
        'f1ffffffffffffff'
      ])
    );
    expect(serializedDoc).to.deep.equal(expectedResult);
  });

  it('wraps to negative on a BigInt that is larger than (2^63 -1)', function () {
    const maxIntPlusOne = { a: 2n ** 63n };
    const serializedMaxIntPlusOne = getSerializedDocParts(BSON.serialize(maxIntPlusOne));
    const expectedResultForMaxIntPlusOne = getSerializedDocParts(
      bufferFromHexArray([
        '12', // int64
        '6100', // 'a' key with null terminator
        '0000000000000080'
      ])
    );
    expect(serializedMaxIntPlusOne).to.deep.equal(expectedResultForMaxIntPlusOne);
  });

  it('serializes BigInts at the edges of the valid range [-2^63, 2^63 - 1]', function () {
    const maxPositiveInt64 = { a: 2n ** 63n - 1n };
    const serializedMaxPositiveInt64 = getSerializedDocParts(BSON.serialize(maxPositiveInt64));
    const expectedSerializationForMaxPositiveInt64 = getSerializedDocParts(
      bufferFromHexArray([
        '12', // int64
        '6100', // 'a' key with null terminator
        'ffffffffffffff7f'
      ])
    );
    expect(serializedMaxPositiveInt64).to.deep.equal(expectedSerializationForMaxPositiveInt64);

    const minPositiveInt64 = { a: -(2n ** 63n) };
    const serializedMinPositiveInt64 = getSerializedDocParts(BSON.serialize(minPositiveInt64));
    const expectedSerializationForMinPositiveInt64 = getSerializedDocParts(
      bufferFromHexArray([
        '12', // int64
        '6100', // 'a' key with null terminator
        '0000000000000080'
      ])
    );
    expect(serializedMinPositiveInt64).to.deep.equal(expectedSerializationForMinPositiveInt64);
  });

  it('truncates a BigInt that is larger than a 64-bit int', function () {
    const testDoc = { a: 2n ** 64n + 1n };
    const serializedDoc = getSerializedDocParts(BSON.serialize(testDoc));
    const expectedSerialization = getSerializedDocParts(
      bufferFromHexArray([
        '12', //int64
        '6100', // 'a' key with null terminator
        '0100000000000000'
      ])
    );
    expect(serializedDoc).to.deep.equal(expectedSerialization);
  });

  it('serializes array of BigInts', function () {
    const testArr = { a: [1n] };
    const serializedArr = BSON.serialize(testArr);
    const expectedSerialization = bufferFromHexArray([
      '04', // array
      '6100', // 'a' key with null terminator
      bufferFromHexArray([
        '12', // int64
        '3000', // '0' key with null terminator
        '0100000000000000' // 1n (little-endian)
      ]).toString('hex')
    ]);
    expect(serializedArr).to.deep.equal(expectedSerialization);
  });

  it('serializes Map with BigInt values', function () {
    const testMap = new Map();
    testMap.set('a', 1n);
    const serializedMap = getSerializedDocParts(BSON.serialize(testMap));
    const expectedSerialization = getSerializedDocParts(
      bufferFromHexArray([
        '12', // int64
        '6100', // 'a' key with null terminator
        '0100000000000000'
      ])
    );
    expect(serializedMap).to.deep.equal(expectedSerialization);
  });
});
