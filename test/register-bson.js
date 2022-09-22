'use strict';

// All test files import BSON from one place here
// This was born out of debugging our karma configuration
// But it can also be a convenient way to run the tests against an alternative implementation
// If you want to run the tests against the typescript directly, change the 'lib' to 'src'
// and make sure you run mocha using our .mocharc.json or with --require ts-node/register

// This should be done by mocha --require, but that isn't supported until mocha version 7+
global.expect = require('chai').expect;
require('array-includes/auto');
require('object.entries/auto');
require('array.prototype.flatmap/auto');

const BSON = require('../lib/bson');
const { ensureBuffer } = require('../lib/ensure_buffer');
BSON.ensureBuffer = ensureBuffer;
module.exports = BSON;
