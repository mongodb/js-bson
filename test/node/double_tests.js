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
});
