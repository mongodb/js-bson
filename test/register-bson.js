'use strict';

const BSON = require('../lib/bson');
const { ensureBuffer } = require('../lib/ensure_buffer');
const { fnv1a24, fnv1a32 } = require('../lib/fnv1a');

BSON.ensureBuffer = ensureBuffer;
BSON.fnv1a24 = fnv1a24;
BSON.fnv1a32 = fnv1a32;

module.exports = BSON;
