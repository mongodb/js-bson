'use strict';

const BSON = require('../register-bson');
const { getNodeMajor, isBrowser } = require('./tools/utils');
const Double = BSON.Double;

describe('Double', function () {
  describe('Constructor', function () {
    var value = 42.3456;

    it('Primitive number', function (done) {
      expect(new Double(value).valueOf()).to.equal(value);
      done();
    });

    it('Number object', function (done) {
      expect(new Double(new Number(value)).valueOf()).to.equal(value);
      done();
    });
  });

  describe('toString', () => {
    it('should serialize to a string', () => {
      const testNumber = Math.random() * Number.MAX_VALUE;
      const double = new Double(testNumber);
      expect(double.toString()).to.equal(testNumber.toString());
    });

    const testRadices = [2, 8, 10, 16, 22];

    for (const radix of testRadices) {
      it(`should support radix argument: ${radix}`, () => {
        const testNumber = Math.random() * Number.MAX_VALUE;
        const double = new Double(testNumber);
        expect(double.toString(radix)).to.equal(testNumber.toString(radix));
      });
    }
  });

  describe('specialValues', () => {
    function twiceSerialized(value) {
      let serializedDouble = BSON.serialize({ d: value });
      let deserializedDouble = BSON.deserialize(serializedDouble, { promoteValues: true });
      let newVal = deserializedDouble.d;
      return newVal;
    }

    it('inf', () => {
      let value = Infinity;
      let newVal = twiceSerialized(value);
      expect(value).to.equal(newVal);
    });

    it('-inf', () => {
      let value = -Infinity;
      let newVal = twiceSerialized(value);
      expect(value).to.equal(newVal);
    });

    it('NaN', () => {
      let value = NaN;
      let newVal = twiceSerialized(value);
      expect(Number.isNaN(newVal)).to.equal(true);
    });

    it('NaN with payload', function () {
      if (!isBrowser() && getNodeMajor() < 10) {
        this.skip();
      }
      let buffer = Buffer.from('120000000000F87F', 'hex');

      const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      let value = dv.getFloat64(0, true);

      let serializedDouble = BSON.serialize({ d: value });
      expect(serializedDouble.subarray(7, 15)).to.deep.equal(buffer);
      let { d: newVal } = BSON.deserialize(serializedDouble, { promoteValues: true });
      expect(Number.isNaN(newVal)).to.equal(true);
    });

    it('0', () => {
      let value = 0;
      let orig = new Double(value);
      let newVal = twiceSerialized(orig);
      expect(value).to.equal(newVal);
    });

    it('-0', () => {
      let value = -0;
      let orig = new Double(value);
      let newVal = twiceSerialized(orig);
      expect(Object.is(newVal, -0)).to.be.true;
    });

    // TODO (NODE-4335): -0 should be serialized as double
    it.skip('-0 serializes as Double', () => {
      let value = -0;
      let serializedDouble = BSON.serialize({ d: value });
      let type = serializedDouble[5];
      expect(type).to.not.equal(BSON.BSON_DATA_NUMBER);
    });

    it('Number.EPSILON', () => {
      let value = Number.EPSILON;
      let newVal = twiceSerialized(value);
      expect(value).to.equal(newVal);
    });
  });
});
