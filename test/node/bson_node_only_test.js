'use strict';

const fs = require('fs');
const expect = require('chai').expect;
const createBSON = require('../utils');
const bson = createBSON();
const Binary = require('../..').Binary;
const assertBuffersEqual = require('./tools/utils').assertBuffersEqual;

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

describe('BSON - Node only', function() {
  it('Should Correctly Serialize and Deserialize a big Binary object', function(done) {
    var data = fs.readFileSync('test/node/data/test_gs_weird_bug.png', 'binary');
    var bin = new Binary();
    bin.write(data);
    var doc = { doc: bin };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
    done();
  });
});

describe('Full BSON - Node only', function() {
  it('Should Correctly Serialize and Deserialize a big Binary object', function(done) {
    var data = fs.readFileSync('test/node/data/test_gs_weird_bug.png', 'binary');
    var bin = new Binary();
    bin.write(data);
    var doc = { doc: bin };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
    done();
  });
});
