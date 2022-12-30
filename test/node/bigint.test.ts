import { BSON, BSONError } from '../register-bson';
import { bufferFromHexArray } from './tools/utils';
import { expect } from 'chai';

describe('BSON BigInt deserialization support', function () {
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

    it('meta test: should test table correctly', () => {
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
});
