'use strict';

const BSON = require('../register-bson');

describe('string tests', function () {
  it('can serialize and deserialize 0xFFFD', function () {
    const unicodeString = String.fromCharCode(0x41, 0x42, 0xfffd, 0x43, 0x44); // "AB�CD"

    const serialized = BSON.serialize({ value: unicodeString });
    BSON.deserialize(serialized);
  });
});
