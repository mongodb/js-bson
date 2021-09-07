'use strict';

const BSON = require('../register-bson');
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
});
