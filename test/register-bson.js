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
const { fnv1a24, fnv1a32 } = require('../lib/fnv1a');

BSON.ensureBuffer = ensureBuffer;
BSON.fnv1a24 = fnv1a24;
BSON.fnv1a32 = fnv1a32;

module.exports = BSON;
