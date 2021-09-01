'use strict';

const BSON = require('../register-bson');
const Int32 = BSON.Int32;

describe('Int32', function () {
  context('Constructor', function () {
    const strHexValue = '0x2a';
    const hexValue = 0x2a;
    const octalValue = 0o52;
    const value = 42;

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
      const testNumber = Math.floor(Math.random() * 0xffffffff);
      const int32 = new Int32(testNumber);
      expect(int32.toString()).to.equal(testNumber.toString());
    });
    const testRadii = Array.from(new Array(35).keys()).map((_, i) => i + 2);

    for (const radix of testRadii) {
      it(`should support radix argument: ${radix}`, () => {
        const testNumber = Math.floor(Math.random() * 0xffffffff);
        const int32 = new Int32(testNumber);
        expect(int32.toString(radix)).to.equal(testNumber.toString(radix));
      });
    }
  });
});
