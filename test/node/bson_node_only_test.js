'use strict';

const fs = require('fs');
const expect = require('chai').expect;
const createBSON = require('../utils');
const bson = createBSON();

describe('Full BSON - Node only', function() {
  it('Should Correctly Deserialize bson file from mongodump', function(done) {
    var data = fs.readFileSync('test/node/data/test.bson', { encoding: null });
    var docs = [];
    var bsonIndex = 0;
    while (bsonIndex < data.length)
      bsonIndex = bson.deserializeStream(data, bsonIndex, 1, docs, docs.length, {
        isArray: true
      });

    expect(docs.length).to.equal(1);
    done();
  });
});
