'use strict';

// TODO(NODE-3555): When we remove karma in favor of vm we can use ts-node to test src instead of lib here.
const BSON = require('../lib/bson');
const { ensureBuffer } = require('../lib/ensure_buffer');
BSON.ensureBuffer = ensureBuffer;
module.exports = BSON;
