'use strict';

const Buffer = require('buffer').Buffer;
const fnv1a = require('../../lib/fnv1a');
const fnv1a24 = fnv1a.fnv1a24;
const expect = require('chai').expect;

describe('fnv1a', function() {
  require('./specs/object-id/vectors.json').vectors.forEach(testCase => {
    const hash = testCase.hash;

    let vector;
    let encoding;
    if (typeof testCase.vector === 'string') {
      vector = testCase.vector;
      encoding = 'utf8';
    } else if (typeof testCase.vectorHex === 'string') {
      vector = testCase.vectorHex;
      encoding = 'hex';
    }

    it(`should properly hash the string "${vector}" with a 24 bit FNV-1a`, function() {
      const hashed = fnv1a24(vector, encoding);
      const buff = Buffer.from([(hashed >>> 16) & 0xff, (hashed >>> 8) & 0xff, hashed & 0xff]);
      expect(buff.toString('hex')).to.equal(hash);
    });
  });
});
