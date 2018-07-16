'use strict';
const Long = require('long');

Object.defineProperty(Long.prototype, '_bsontype', { value: 'Long' });
module.exports = Long;
