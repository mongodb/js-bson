'use strict';

const BSON = require('../../lib/bson');
const Int32 = BSON.Int32;
const expect = require('chai').expect;

describe('Int32', function() {
  describe('Constructor', function() {
    var value = 42;

    it('Primitive number', function(done) {
      expect(new Int32(value).valueOf()).to.equal(value);
      done();
    });

    it('Number object', function(done) {
      expect(new Int32(new Number(value)).valueOf()).to.equal(value);
      done();
    });
  });
});
