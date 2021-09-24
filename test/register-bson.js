'use strict';

// All test files import BSON from one place here
// This was born out of debugging our karma configuration
// But it can also be a convenient way to run the tests against an alternative implementation
// If you want to run the tests against the typescript directly, change the 'lib' to 'src'
// and make sure you run mocha using our .mocharc.json or with --require ts-node/register

// This should be done by mocha --require, but that isn't supported until mocha version 7+
require('chai/register-expect');

const BSON = require('../lib/bson');
const { ensureBuffer } = require('../lib/ensure_buffer');

const Assertion = require('chai').Assertion;
const util = require('chai').util;
Assertion.overwriteMethod('throw', function (original) {
  return function assertThrow(...args) {
    if (args.length === 0 || args.includes(BSON.BSONError) || args.includes(BSON.BSONTypeError)) {
      // By default, lets check for BSONError or BSONTypeError
      // Since we compile to es5 instanceof is broken???
      const assertion = original.apply(this, args);
      const object = util.flag(assertion, 'object');
      return this.assert(object && /BSONError|BSONTypeError/.test(object.stack));
    } else {
      return original.apply(this, args);
    }
  };
});

BSON.ensureBuffer = ensureBuffer;

module.exports = BSON;
