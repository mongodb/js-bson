'use strict';

const crypto = require('crypto');
const expect = require('chai').expect;
const Binary = require('../../lib/binary');

describe('Binary', function() {
  it('Should convert Binary to itself with same value', function(done) {
    /* eslint-disable */
    const randomBuffer = crypto.randomBytes
      ? crypto.randomBytes(256)
      : new Uint8Array(256);
    if (!crypto.randomBytes) {
      window.crypto.getRandomValues(randomBuffer);
    }
    /* eslint-enable */
    const binary1 = new Binary(randomBuffer);
    const binary2 = new Binary(binary1.value(), binary1.sub_type);
    expect(binary1.value(), 'both value() should return same value').to.equal(binary2.value());
    done();
  });
});
