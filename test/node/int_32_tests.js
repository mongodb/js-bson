'use strict';

const BSON = require('../../lib/bson');
const Int32 = BSON.Int32;
const expect = require('chai').expect;

describe('Int32', function() {
  describe('Constructor', function() {
    const hexValue = '0x2A';
    const octalValue = 0o52;
    const value = 42;

    it('Primitive number', function(done) {
      expect(new Int32(value).valueOf()).to.equal(value);
      done();
    });

    it('Number object', function(done) {
      expect(new Int32(new Number(value)).valueOf()).to.equal(value);
      done();
    });

    it('Hex', function(done) {
      expect(new Int32(hexValue).valueOf()).to.equal(value);
      done();
    });

    it('Octal', function(done) {
      expect(new Int32(octalValue).valueOf()).to.equal(value);
      done();
    });

    it('Cases covering Int32 value conversion using +', function(done) {
      const string = BSON.serialize({ key: new Int32('fortyTwo') });
      const plus = BSON.serialize({ key: new Int32(+'fortyTwo') });
      const intLedString = BSON.serialize({ key: new Int32('42fortyTwo') });
      const intLedPlus = BSON.serialize({ key: new Int32(+'42fortyTwo') });
      const fortyTwo = BSON.serialize({ key: new Int32(value) });
      const hexFortyTwo = BSON.serialize({ key: new Int32(hexValue) });
      const plusHexFortyTwo = BSON.serialize({ key: new Int32(hexValue) });
      const octal = BSON.serialize({ key: new Int32(octalValue) });
      const plusOctal = BSON.serialize({ key: new Int32(+octalValue) });
      const zero = BSON.serialize({ key: new Int32(0) });
      const plusZero = BSON.serialize({ key: new Int32(+'0') });
      const positiveZero = BSON.serialize({ key: new Int32(+0) });
      const negativeZero = BSON.serialize({ key: new Int32(-0) });
      const inf = BSON.serialize({ key: new Int32(Infinity) });
      const strInf = BSON.serialize({ key: new Int32('Infinity') });
      const plusStrInf = BSON.serialize({ key: new Int32(+'Infinity') });
      const posInf = BSON.serialize({ key: new Int32(+Infinity) });
      const negInf = BSON.serialize({ key: new Int32(-Infinity) });
      expect(string.equals(zero)).to.be.true;
      expect(plus.equals(zero)).to.be.true;
      expect(intLedString.equals(zero)).to.be.true;
      expect(intLedPlus.equals(zero)).to.be.true;
      expect(hexFortyTwo.equals(fortyTwo)).to.be.true;
      expect(plusHexFortyTwo.equals(fortyTwo)).to.be.true;
      expect(octal.equals(fortyTwo)).to.be.true;
      expect(plusOctal.equals(fortyTwo)).to.be.true;
      expect(plusZero.equals(zero)).to.be.true;
      expect(positiveZero.equals(zero)).to.be.true;
      expect(negativeZero.equals(zero)).to.be.true;
      expect(inf.equals(zero)).to.be.true;
      expect(strInf.equals(zero)).to.be.true;
      expect(plusStrInf.equals(zero)).to.be.true;
      expect(posInf.equals(zero)).to.be.true;
      expect(negInf.equals(zero)).to.be.true;
      done();
    });
  });
});
