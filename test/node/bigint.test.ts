import { BSON, BSONError, EJSON } from '../register-bson';
import { bufferFromHexArray } from './tools/utils';
import { expect } from 'chai';
import { BSON_DATA_LONG } from '../../src/constants';
import { BSONDataView } from '../../src/utils/byte_utils';

describe('BSON BigInt support', function () {
  describe('BSON.deserialize()', function () {
    type DeserialzationOptions = {
      useBigInt64: boolean | undefined;
      promoteValues: boolean | undefined;
      promoteLongs: boolean | undefined;
    };
    type TestTableEntry = {
      options: DeserialzationOptions;
      shouldThrow: boolean;
      expectedResult: BSON.Document;
      expectedErrorMessage: string;
    };
    const testSerializedDoc = bufferFromHexArray(['12', '6100', '2300000000000000']); // key 'a', value 0x23 as int64
    const useBigInt64Values = [true, false, undefined];
    const promoteLongsValues = [true, false, undefined];
    const promoteValuesValues = [true, false, undefined];

    const testTable = useBigInt64Values.flatMap(useBigInt64 => {
      return promoteLongsValues.flatMap(promoteLongs => {
        return promoteValuesValues.flatMap(promoteValues => {
          const useBigInt64Set = useBigInt64 ?? false;
          const promoteLongsSet = promoteLongs ?? true;
          const promoteValuesSet = promoteValues ?? true;
          const shouldThrow = useBigInt64Set && (!promoteValuesSet || !promoteLongsSet);
          let expectedResult: BSON.Document;
          if (useBigInt64Set) {
            expectedResult = { a: 0x23n };
          } else if (promoteLongsSet && promoteValuesSet) {
            expectedResult = { a: 0x23 };
          } else {
            expectedResult = { a: new BSON.Long(0x23) };
          }
          const expectedErrorMessage = shouldThrow
            ? 'Must either request bigint or Long for int64 deserialization'
            : '';
          return [
            {
              options: { useBigInt64, promoteValues, promoteLongs },
              shouldThrow,
              expectedResult,
              expectedErrorMessage
            }
          ];
        });
      });
    });

    it('meta test: generates 27 tests with exactly 5 error cases and 22 success cases', () => {
      expect(testTable).to.have.lengthOf(27);
      expect(testTable.filter(t => t.shouldThrow)).to.have.lengthOf(5);
      expect(testTable.filter(t => !t.shouldThrow)).to.have.lengthOf(22);
    });

    function generateTestDescription(entry: TestTableEntry): string {
      const options = entry.options;
      const promoteValues = `promoteValues ${
        options.promoteValues === undefined ? 'is default' : `is ${options.promoteValues}`
      }`;
      const promoteLongs = `promoteLongs ${
        options.promoteLongs === undefined ? 'is default' : `is ${options.promoteLongs}`
      }`;
      const useBigInt64 = `useBigInt64 ${
        options.useBigInt64 === undefined ? 'is default' : `is ${options.useBigInt64}`
      }`;
      const flagString = `${useBigInt64}, ${promoteValues}, and ${promoteLongs}`;
      if (entry.shouldThrow) {
        return `throws when ${flagString}`;
      } else {
        return `deserializes int64 to ${entry.expectedResult.a.constructor.name} when ${flagString}`;
      }
    }

    function generateTest(test: TestTableEntry) {
      const options = test.options;
      const deserialize = () => {
        return BSON.deserialize(testSerializedDoc, options);
      };
      if (test.shouldThrow) {
        return () => {
          expect(deserialize).to.throw(BSONError, test.expectedErrorMessage);
        };
      } else {
        return () => {
          const deserializedDoc = deserialize();
          expect(deserializedDoc).to.deep.equal(test.expectedResult);
        };
      }
    }

    for (const tableEntry of testTable) {
      const test = generateTest(tableEntry);
      const description = generateTestDescription(tableEntry);

      it(description, test);
    }
  });

  describe('BSON.serialize()', function () {
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

  describe('EJSON.parse()', function () {
    type ParseOptions = {
      useBigInt64: boolean | undefined;
      relaxed: boolean | undefined;
    };
    type TestTableEntry = {
      options: ParseOptions;
      expectedResult: BSON.Document;
    };

    const useBigInt64Values = [true, false, undefined];
    const relaxedValues = [true, false, undefined];
    const sampleCanonicalString = '{"a":{"$numberLong":"23"}}';
    const sampleRelaxedString = '{"a":4294967296}';

    function genTestTable(
      useBigInt64: boolean | undefined,
      relaxed: boolean | undefined,
      getExpectedResult: (boolean, boolean) => BSON.Document
    ): [TestTableEntry] {
      const useBigInt64IsSet = useBigInt64 ?? false;
      const relaxedIsSet = relaxed ?? true;

      const expectedResult = getExpectedResult(useBigInt64IsSet, relaxedIsSet);

      return [{ options: { useBigInt64, relaxed }, expectedResult }];
    }

    function generateTestDescription(entry: TestTableEntry, inputString: string): string {
      // TODO(NODE-4874): When NODE-4873 is merged in, replace this with EJSON.stringify
      const options = entry.options;
      return `parses field 'a' of '${inputString}' to '${entry.expectedResult.a.constructor.name}' when useBigInt64 is ${options.useBigInt64} and relaxed is ${options.relaxed}`;
    }

    function generateTest(entry: TestTableEntry, sampleString: string): () => void {
      const options = entry.options;

      return () => {
        const parsed = EJSON.parse(sampleString, {
          useBigInt64: options.useBigInt64,
          relaxed: options.relaxed
        });
        expect(parsed).to.deep.equal(entry.expectedResult);
      };
    }

    describe('canonical input', function () {
      const canonicalInputTestTable = useBigInt64Values.flatMap(useBigInt64 => {
        return relaxedValues.flatMap(relaxed => {
          return genTestTable(
            useBigInt64,
            relaxed,
            (useBigInt64IsSet: boolean, relaxedIsSet: boolean) =>
              useBigInt64IsSet
                ? { a: 23n }
                : relaxedIsSet
                ? { a: 23 }
                : { a: BSON.Long.fromNumber(23) }
          );
        });
      });

      it('meta test: generates 9 tests', () => {
        expect(canonicalInputTestTable).to.have.lengthOf(9);
      });

      for (const entry of canonicalInputTestTable) {
        const test = generateTest(entry, sampleCanonicalString);
        const description = generateTestDescription(entry, sampleCanonicalString);

        it(description, test);
      }
    });

    describe('relaxed input', function () {
      const relaxedInputTestTable = useBigInt64Values.flatMap(useBigInt64 => {
        return relaxedValues.flatMap(relaxed => {
          return genTestTable(
            useBigInt64,
            relaxed,
            (useBigInt64IsSet: boolean, relaxedIsSet: boolean) =>
              useBigInt64IsSet
                ? { a: 4294967296n }
                : relaxedIsSet
                ? { a: 4294967296 }
                : { a: BSON.Long.fromNumber(4294967296) }
          );
        });
      });
      it('meta test: generates 9 tests', () => {
        expect(relaxedInputTestTable).to.have.lengthOf(9);
      });

      /*
      const entry = relaxedInputTestTable[5];
      const test = generateTest(entry, sampleRelaxedString);
      const description = generateTestDescription(entry, sampleRelaxedString);
      it.only(description, test);
      */

      for (const entry of relaxedInputTestTable) {
        const test = generateTest(entry, sampleRelaxedString);
        const description = generateTestDescription(entry, sampleRelaxedString);

        it(description, test);
      }
    });
  });
});
