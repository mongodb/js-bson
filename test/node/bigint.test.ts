import { BSON, BSONError } from '../register-bson';
import { bufferFromHexArray } from './tools/utils';
import { expect } from 'chai';

describe('BSON BigInt deserialization support', function() {
  describe('BSON.deserialize()', function() {
    const testSerializedDoc = bufferFromHexArray(['12', '6100', '2300000000000000']);
    type DeserialzationOptions = {
      useBigInt64: boolean | undefined,
      promoteValues: boolean | undefined,
      promoteLongs: boolean | undefined,
    };
    type TestTableEntry = {
      options: DeserialzationOptions,
      isThrowTest: boolean,
      expectedResult?: BSON.Document,
      expectedError?: Error
    };
    const testTable = [
      { options: { useBigInt64: undefined, promoteValues: undefined, promoteLongs: undefined }, isThrowTest: false, expectedResult: { a: 0x23 } },
      { options: { useBigInt64: true, promoteValues: undefined, promoteLongs: undefined }, isThrowTest: false, expectedResult: { a: 0x23n } },
      { options: { useBigInt64: true, promoteValues: undefined, promoteLongs: undefined }, isThrowTest: false, expectedResult: { a: 0x23n } },
      { options: { useBigInt64: true, promoteValues: undefined, promoteLongs: true }, isThrowTest: false, expectedResult: { a: 0x23n } },
      { options: { useBigInt64: false, promoteValues: undefined, promoteLongs: true }, isThrowTest: false, expectedResult: { a: 0x23 } },
      { options: { useBigInt64: false, promoteValues: undefined, promoteLongs: undefined }, isThrowTest: false, expectedResult: { a: 0x23 } },
      { options: { useBigInt64: false, promoteValues: undefined, promoteLongs: false }, isThrowTest: false, expectedResult: { a: new BSON.Long(0x23) } },
      { options: { useBigInt64: undefined, promoteValues: undefined, promoteLongs: false }, isThrowTest: false, expectedResult: { a: new BSON.Long(0x23) } },
      { options: { useBigInt64: undefined, promoteValues: false, promoteLongs: undefined }, isThrowTest: false, expectedResult: { a: new BSON.Long(0x23) } },
      { options: { useBigInt64: false, promoteValues: false, promoteLongs: undefined }, isThrowTest: false, expectedResult: { a: new BSON.Long(0x23) } },
      { options: { useBigInt64: false, promoteValues: false, promoteLongs: false }, isThrowTest: false, expectedResult: { a: new BSON.Long(0x23) } },
      { options: { useBigInt64: true, promoteValues: true, promoteLongs: true }, isThrowTest: false, expectedResult: { a: 0x23n } },
      { options: { useBigInt64: false, promoteValues: undefined, promoteLongs: false }, isThrowTest: false, expectedResult: { a: new BSON.Long(0x23) } },
      { options: { useBigInt64: true, promoteValues: undefined, promoteLongs: false }, isThrowTest: true, expectedError: new BSONError("") },
      { options: { useBigInt64: true, promoteValues: false, promoteLongs: undefined }, isThrowTest: true, expectedError: new BSONError("") },
    ];

    function generateTestDescription(entry: TestTableEntry): string {
      const promoteValues = `promoteValues ${entry.promoteValues == undefined ? 'is default' : `== ${entry.promoteValues}`}`;
      const promoteLongs = `promoteLongs ${entry.promoteLongs == undefined ? 'is default' : `== ${entry.promoteLongs}`}`;
      const useBigInt64 = `useBigInt64 ${entry.useBigInt64 == undefined ? 'is default' : `== ${entry.useBigInt64}`}`;
      const flagString = ` ${useBigInt64}, ${promoteValues}, and ${promoteLongs}`
      if (entry.isThrowTest) {
        return `throws when ${flagString}`;
      } else {
        return `deserializes int64 to ${typeof entry.expectedResult} when ${flagString}`
      }
    }

    function generateTest(entry: TestTableEntry) {
      const options = entry.options;
      if (entry.isThrowTest) {
        return function() {
          expect(function() {
            BSON.deserialize(testSerializedDoc, options);
          }).to.throw(entry.expectedError?.name)
        }
      } else {
        return () => {
          const deserializedDoc = BSON.deserialize(testSerializedDoc, options);
          expect(deserializedDoc).to.deep.equal(entry.expectedResult);
        }
      }
    }

    for (let entry of testTable) {
      let test = generateTest(entry);
      let description = generateTestDescription(entry);

      it(description, test);
    }

    // TODO(NODE-4871): Check for duplicated tests
    // TODO(NODE-4871): Ensure all desired test cases are covered
    /*
    it('deserializes int64 to Number when useBigInt64,promoteValues, promoteLongs are default', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc);
      expect(deserializedDoc).to.deep.equal({ a: 0x23 });
    });

    it('deserializes int64 to BigInt when useBigInt64 == true, promoteValues, promoteLongs are default', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { useBigInt64: true });
      expect(deserializedDoc).to.deep.equal({ a: 0x23n });
    });

    it('deserializes int64 to BigInt when useBigInt64 == true and promoteLongs == true', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, {
        useBigInt64: true,
        promoteLongs: true
      });
      expect(deserializedDoc).to.deep.equal({ a: 0x23n });
    });

    it('deserializes int64 to Number when useBigInt64 == false and promoteLongs == true', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, {
        useBigInt64: false,
        promoteLongs: true
      });
      expect(deserializedDoc).to.deep.equal({ a: 0x23 });
    });

    it('deserializes int64 to Number when useBigInt64 == false and promoteLongs is default', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { useBigInt64: false });
      expect(deserializedDoc).to.deep.equal({ a: 0x23 });
    });

    it('deserializes int64 to BSON.Long when useBigInt64 == false and promoteLongs == false', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, {
        useBigInt64: false,
        promoteLongs: false
      });
      expect(deserializedDoc).to.deep.equal({ a: new BSON.Long(0x23) });
    });

    it('deserializes int64 to BSON.Long when useBigInt64 is default and promoteValues == false', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { promoteValues: false });
      expect(deserializedDoc).to.deep.equal({ a: new BSON.Long(0x23) });
    });

    it('deserializes int64 to BSON.Long when useBigInt64 == false and promoteValues == false', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, {
        useBigInt64: false,
        promoteValues: false
      });
      expect(deserializedDoc).to.deep.equal({ a: new BSON.Long(0x23) });
    });

    it('deserializes int64 to BSON.Long when useBigInt64 == false, promoteLongs == false, and promoteValues == false', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, {
        useBigInt64: false,
        promoteLongs: false,
        promoteValues: false
      });
      expect(deserializedDoc).to.deep.equal({ a: new BSON.Long(0x23) });
    });

    it('deserializes int64 to Number when useBigInt64 == false, promoteLongs == true, and promoteValues == true', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, {
        useBigInt64: false,
        promoteLongs: true,
        promoteValues: true
      });
      expect(deserializedDoc).to.deep.equal({ a: 0x23 });
    });

    it('deserializes int64 to BigInt when useBigInt64 == true, promoteLongs == true, and promoteValues == true', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, {
        useBigInt64: true,
        promoteLongs: true,
        promoteValues: true
      });
      expect(deserializedDoc).to.deep.equal({ a: 0x23n });
    });

    it('deserializes int64 to BSON.Long when useBigInt64 == false and promoteLongs == false', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, {
        useBigInt64: false,
        promoteLongs: false
      });
      expect(deserializedDoc).to.deep.equal({ a: new BSON.Long(0x23) });
    });

    it('throws error when useBigInt64 == true and promoteLongs == false', function() {
      expect(function() {
        BSON.deserialize(testSerializedDoc, { useBigInt64: true, promoteLongs: false });
      }).to.throw(BSON.BSONError);
    });

    it('throws error when useBigInt64 == true and promoteValues == false', function() {
      expect(function() {
        BSON.deserialize(testSerializedDoc, { useBigInt64: true, promoteValues: false });
      }).to.throw(BSON.BSONError);
    });
    */
  });
});
