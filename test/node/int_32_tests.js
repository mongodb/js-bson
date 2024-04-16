'use strict';

const BSON = require('../register-bson');
const Int32 = BSON.Int32;
const BSONError = BSON.BSONError;

describe('Int32', function () {
  context('Constructor', function () {
    const strHexValue = '0x2a';
    const hexValue = 0x2a;
    const octalValue = 0o52;
    const value = 42;
    const upperBoundValue = 0x7fffffff;
    const lowerBoundValue = -0x80000000;
    const outOfUpperBoundValue = 0x80000000;
    const outOfLowerBoundValue = -0x80000001;

    it('should accept primitive numbers', function (done) {
      expect(new Int32(value).valueOf()).to.equal(value);
      done();
    });

    it('should accept number objects', function (done) {
      expect(new Int32(new Number(value)).valueOf()).to.equal(value);
      done();
    });

    it('should accept string Hex', function (done) {
      expect(new Int32(strHexValue).valueOf()).to.equal(value);
      done();
    });

    it('should accept hex', function (done) {
      expect(new Int32(hexValue).valueOf()).to.equal(value);
      done();
    });

    it('should accept octal', function (done) {
      expect(new Int32(octalValue).valueOf()).to.equal(value);
      done();
    });

    it('should accept int32 minimum input of -0x80000000', function (done) {
      expect(new Int32(lowerBoundValue).valueOf()).to.equal(lowerBoundValue);
      done();
    });

    it('should accept int32 maximum input of 0x7fffffff', function (done) {
      expect(new Int32(upperBoundValue).valueOf()).to.equal(upperBoundValue);
      done();
    });

    it('should truncate the input bits to int32 for inputs smaller than -0x80000000', function (done) {
      expect(new Int32(outOfLowerBoundValue).valueOf()).to.equal(0x7fffffff);
      done();
    });

    it('should truncate the input bits to int32 for inputs larger than 0x7fffffff', function (done) {
      expect(new Int32(outOfUpperBoundValue).valueOf()).to.equal(-0x80000000);
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

    it('should have serialization consistency across different representations of 42', function () {
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

  describe('fromString', () => {
    const acceptedInputs = [
      ['Int32.max', '2147483647', new Int32(2147483647)],
      ['Int32.min', '-2147483648', new Int32(-2147483648)],
      ['zero', '0', new Int32(0)],
      ['non-leading zeros', '45000000', new Int32(45000000)],
      ['zero with leading zeros', '000000', new Int32(0)],
      ['positive leading zeros', '000000867', new Int32(867)],
      ['explicity positive leading zeros', '+000000867', new Int32(867)],
      ['negative leading zeros', '-00007', new Int32(-7)]
    ];
    const errorInputs = [
      ['Int32.max + 1', '2147483648'],
      ['Int32.min - 1', '-2147483649'],
      ['positive integer with decimal', '2.0'],
      ['zero with decimal', '0.0'],
      ['negative zero', '-0'],
      ['Infinity', 'Infinity'],
      ['-Infinity', '-Infinity'],
      ['NaN', 'NaN'],
      ['fraction', '2/3'],
      ['commas', '34,450'],
      ['exponentiation notation', '1e1'],
      ['octal', '0o1'],
      ['binary', '0b1'],
      ['hex', '0x1'],
      ['empty string', ''],
      ['leading and trailing whitespace', '    89   ', 89]
    ];

    for (const [testName, value, expectedInt32] of acceptedInputs) {
      context(`when case is ${testName}`, () => {
        it(`should return Int32 that matches expected value`, () => {
          expect(Int32.fromString(value).value).to.equal(expectedInt32.value);
        });
      });
    }
    for (const [testName, value] of errorInputs) {
      context(`when case is ${testName}`, () => {
        it(`should throw correct error`, () => {
          expect(() => Int32.fromString(value)).to.throw(BSONError, /not a valid Int32 string/);
        });
      });
    }
  });
});
