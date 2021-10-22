'use strict';

const BSON = require('../register-bson');
const Int32 = BSON.Int32;

describe('Int32', function () {
  context('Constructor', function () {
    const strHexValue = '0x2a';
    const hexValue = 0x2a;
    const octalValue = 0o52;
    const value = 42;
    const upperBoundValue = 2 ** 31 - 1;
    const lowerBoundValue = -(2 ** 31);
    const outOfUpperBoundValue = 2 ** 40;
    const outOfLowerBoundValue = -(2 ** 40);

    it('Primitive number', function (done) {
      expect(new Int32(value).valueOf()).to.equal(value);
      done();
    });

    it('Number object', function (done) {
      expect(new Int32(new Number(value)).valueOf()).to.equal(value);
      done();
    });

    it('String Hex', function (done) {
      expect(new Int32(strHexValue).valueOf()).to.equal(value);
      done();
    });

    it('Hex', function (done) {
      expect(new Int32(hexValue).valueOf()).to.equal(value);
      done();
    });

    it('Octal', function (done) {
      expect(new Int32(octalValue).valueOf()).to.equal(value);
      done();
    });

    it('Lower bound', function (done) {
      expect(new Int32(lowerBoundValue).valueOf()).to.equal(lowerBoundValue);
      done();
    });

    it('Upper bound', function (done) {
      expect(new Int32(upperBoundValue).valueOf()).to.equal(upperBoundValue);
      done();
    });

    it('Outside lower bound', function (done) {
      expect(new Int32(outOfLowerBoundValue).valueOf()).to.equal(0);
      done();
    });

    it('Outside upper bound', function (done) {
      expect(new Int32(outOfUpperBoundValue).valueOf()).to.equal(0);
      done();
    });

    it('should equal zero', function () {
      const prop = 'key';
      const zero = BSON.serialize({ [prop]: new Int32(0) }).toString();
      // should equal zero
      ['fortyTwo', '42fortyTwo', '0', 0, Infinity, 'Infinity'].forEach(value => {
        expect(BSON.serialize({ [prop]: new Int32(value) }).toString()).to.equal(zero);
        expect(BSON.serialize({ [prop]: new Int32(+value) }).toString()).to.equal(zero);
      });
    });

    it('should equal fortyTwo', function () {
      const prop = 'key';
      const fortyTwo = BSON.serialize({ [prop]: new Int32(value) }).toString();
      // should equal fortyTwo
      [strHexValue, hexValue, octalValue].forEach(value => {
        expect(BSON.serialize({ [prop]: new Int32(value) }).toString()).to.equal(fortyTwo);
        expect(BSON.serialize({ [prop]: new Int32(+value) }).toString()).to.equal(fortyTwo);
      });
    });
  });

  describe('toString', () => {
    it('should serialize to a string', () => {
      const testNumber = 0x7fffffff;
      const int32 = new Int32(testNumber);
      expect(int32.toString()).to.equal(testNumber.toString());
    });

    const testRadices = [2, 8, 10, 16, 22];

    for (const radix of testRadices) {
      it(`should support radix argument: ${radix}`, () => {
        const testNumber = 0x7fffffff;
        const int32 = new Int32(testNumber);
        expect(int32.toString(radix)).to.equal(testNumber.toString(radix));
      });
    }
  });
});
