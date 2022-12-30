import { BSON, BSONError } from '../register-bson';
import { bufferFromHexArray } from './tools/utils';
import { expect } from 'chai';

describe('BSON BigInt deserialization support', function () {
  describe('BSON.deserialize()', function () {
    const testSerializedDoc = bufferFromHexArray(['12', '6100', '2300000000000000']); // key 'a', value 0x23 as int64
    type DeserialzationOptions = {
      useBigInt64: boolean | undefined;
      promoteValues: boolean | undefined;
      promoteLongs: boolean | undefined;
    };
    type TestTableEntry = {
      options: DeserialzationOptions;
      shouldThrow: boolean;
      expectedResult?: BSON.Document;
      expectedErrorMessage?: string;
    };
    const testTable = [
      {
        options: { useBigInt64: undefined, promoteValues: undefined, promoteLongs: undefined },
        shouldThrow: false,
        expectedResult: { a: 0x23 }
      },
      {
        options: { useBigInt64: true, promoteValues: undefined, promoteLongs: undefined },
        shouldThrow: false,
        expectedResult: { a: 0x23n }
      },
      {
        options: { useBigInt64: true, promoteValues: false, promoteLongs: undefined },
        shouldThrow: true,
        expectedErrorMessage: 'Must either request bigint or Long for int64 deserialization'
      },
      {
        options: { useBigInt64: true, promoteValues: undefined, promoteLongs: true },
        shouldThrow: false,
        expectedResult: { a: 0x23n }
      },
      {
        options: { useBigInt64: false, promoteValues: undefined, promoteLongs: true },
        shouldThrow: false,
        expectedResult: { a: 0x23 }
      },
      {
        options: { useBigInt64: false, promoteValues: undefined, promoteLongs: undefined },
        shouldThrow: false,
        expectedResult: { a: 0x23 }
      },
      {
        options: { useBigInt64: false, promoteValues: undefined, promoteLongs: false },
        shouldThrow: false,
        expectedResult: { a: new BSON.Long(0x23) }
      },
      {
        options: { useBigInt64: undefined, promoteValues: undefined, promoteLongs: false },
        shouldThrow: false,
        expectedResult: { a: new BSON.Long(0x23) }
      },
      {
        options: { useBigInt64: undefined, promoteValues: false, promoteLongs: undefined },
        shouldThrow: false,
        expectedResult: { a: new BSON.Long(0x23) }
      },
      {
        options: { useBigInt64: false, promoteValues: false, promoteLongs: undefined },
        shouldThrow: false,
        expectedResult: { a: new BSON.Long(0x23) }
      },
      {
        options: { useBigInt64: false, promoteValues: false, promoteLongs: false },
        shouldThrow: false,
        expectedResult: { a: new BSON.Long(0x23) }
      },
      {
        options: { useBigInt64: false, promoteValues: true, promoteLongs: true },
        shouldThrow: false,
        expectedResult: { a: 0x23 }
      },
      {
        options: { useBigInt64: true, promoteValues: true, promoteLongs: true },
        shouldThrow: false,
        expectedResult: { a: 0x23n }
      },
      {
        options: { useBigInt64: false, promoteValues: undefined, promoteLongs: false },
        shouldThrow: false,
        expectedResult: { a: new BSON.Long(0x23) }
      },
      {
        options: { useBigInt64: true, promoteValues: undefined, promoteLongs: false },
        shouldThrow: true,
        expectedErrorMessage: 'Must either request bigint or Long for int64 deserialization'
      }
    ];

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
        return `deserializes int64 to ${typeof entry.expectedResult} when ${flagString}`;
      }
    }

    function generateTest(test: TestTableEntry) {
      const options = test.options;
      if (test.shouldThrow) {
        return function () {
          expect(function () {
            BSON.deserialize(testSerializedDoc, options);
          }).to.throw(BSONError, test.expectedErrorMessage ?? '');
        };
      } else {
        return () => {
          const deserializedDoc = BSON.deserialize(testSerializedDoc, options);
          expect(deserializedDoc).to.deep.equal(test.expectedResult);
        };
      }
    }

    for (const entry of testTable) {
      const test = generateTest(entry);
      const description = generateTestDescription(entry);

      it(description, test);
    }
  });
});
