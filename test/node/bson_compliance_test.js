'use strict';

const Buffer = require('buffer').Buffer;
const BSON = require('../register-bson');

describe('BSON Compliance', function () {
  /**
   * @ignore
   */
  it('Pass all corrupt BSON scenarios ./compliance/corrupt.json', function (done) {
    // Read and parse the json file
    const scenarios = require('./compliance/corrupt');

    for (let i = 0; i < scenarios.documents.length; i++) {
      const doc = scenarios.documents[i];
      if (doc.skip) continue;

      try {
        // Create a buffer containing the payload
        const buffer = Buffer.from(doc.encoded, 'hex');
        // Attempt to deserialize
        BSON.deserialize(buffer);
        expect(false).to.be.ok;
      } catch (err) {
        expect(true).to.be.ok;
      }
    }

    done();
  });
});
