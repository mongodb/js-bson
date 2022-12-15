import { BSON } from '../register-bson';
import { bufferFromHexArray } from './tools/utils';
import { expect } from 'chai';

describe("BSON BigInt deserialization support", function() {
  describe("BSON.deserialize()", function() {
    let testSerializedDoc: Buffer;
    before(function() {
      testSerializedDoc = bufferFromHexArray([
        '12',
        '6100',
        '2300000000000000'
      ]);
    });

    it('deserializes int64 to Number when useBigInt64,promoteValues, promoteLongs are default', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc);
      expect(deserializedDoc).to.deep.equal({ a: 0x23 });
    });

    it('deserializes int64 to BigInt when useBigInt64 == true, promoteValues, promoteLongs are default', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { useBigInt64: true });
      expect(deserializedDoc).to.deep.equal({ a: 0x23n });
    });

    it('deserializes int64 to BigInt when useBigInt64 == true and promoteLongs == true', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { useBigInt64: true, promoteLongs: true });
      expect(deserializedDoc).to.deep.equal({ a: 0x23n });
    });

    it('deserializes int64 to Number when useBigInt64 == false and promoteLongs == true', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { useBigInt64: false, promoteLongs: true });
      expect(deserializedDoc).to.deep.equal({ a: 0x23 });
    });

    it('deserializes int64 to Number when useBigInt64 == false and promoteLongs is default', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { useBigInt64: false });
      expect(deserializedDoc).to.deep.equal({ a: 0x23 });
    });

    it('deserializes int64 to BSON.Long when useBigInt64 == false and promoteLongs == false', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { useBigInt64: false, promoteLongs: false });
      expect(deserializedDoc).to.deep.equal({ a: new BSON.Long(0x23) });
    });

    it('deserializes int64 to BSON.Long when useBigInt64 is default and promoteValues == false', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { promoteValues: false });
      expect(deserializedDoc).to.deep.equal({ a: new BSON.Long(0x23) });
    });


    it('deserializes int64 to BSON.Long when useBigInt64 == false and promoteValues == false', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { useBigInt64: false, promoteValues: false });
      expect(deserializedDoc).to.deep.equal({ a: new BSON.Long(0x23) });
    });

    it('deserializes int64 to BSON.Long when useBigInt64 == false, promoteLongs == false, and promoteValues == false', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { useBigInt64: false, promoteLongs: false, promoteValues: false });
      expect(deserializedDoc).to.deep.equal({ a: new BSON.Long(0x23) });
    });

    it('deserializes int64 to Number when useBigInt64 == false, promoteLongs == true, and promoteValues == true', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { useBigInt64: false, promoteLongs: true, promoteValues: true });
      expect(deserializedDoc).to.deep.equal({ a: 0x23 });
    });

    it('deserializes int64 to Number when useBigInt64 == true, promoteLongs == true, and promoteValues == true', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { useBigInt64: true, promoteLongs: true, promoteValues: true });
      expect(deserializedDoc).to.deep.equal({ a: 0x23n });
    });

    it('deserializes int64 to BSON.Long when useBigInt64 == false and promoteLongs == false', function() {
      const deserializedDoc = BSON.deserialize(testSerializedDoc, { useBigInt64: false, promoteLongs: false });
      expect(deserializedDoc).to.deep.equal({ a: new BSON.Long(0x23) });
    });

    it('throws error when useBigInt64 == true and promoteLongs == false', function() {
      expect(() => {
        BSON.deserialize(testSerializedDoc, { useBigInt64: true, promoteLongs: false });
      }).to.throw;
    });

    it('throws error when useBigInt64 == true and promoteValues == false', function() {
      expect(() => {
        BSON.deserialize(testSerializedDoc, { useBigInt64: true, promoteValues: false });
      }).to.throw;
    });
  });
});
