'use strict';

const fs = require('fs');
const path = require('path');
const BSON = require('../register-bson');
const Binary = BSON.Binary;
const { assertBuffersEqual } = require('./tools/utils');
const Buffer = require('buffer').Buffer;

describe('BSON - Node only', function () {
  it('Should Correctly Serialize and Deserialize a big Binary object', function (done) {
    var data = fs.readFileSync(path.resolve(__dirname, './data/test_gs_weird_bug.png'), 'binary');
    var bin = new Binary();
    bin.write(data);
    var doc = { doc: bin };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);
    expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
    done();
  });
});

describe('Full BSON - Node only', function () {
  it('Should Correctly Serialize and Deserialize a big Binary object', function (done) {
    var data = fs.readFileSync(path.resolve(__dirname, './data/test_gs_weird_bug.png'), 'binary');
    var bin = new Binary();
    bin.write(data);
    var doc = { doc: bin };
    var serialized_data = BSON.serialize(doc);
    var deserialized_data = BSON.deserialize(serialized_data);
    expect(doc.doc.value()).to.equal(deserialized_data.doc.value());
    done();
  });

  it('Should Correctly Deserialize bson file from mongodump', function (done) {
    var data = fs.readFileSync(path.resolve(__dirname, './data/test.bson'), { encoding: null });
    data = Buffer.from(data);
    var docs = [];
    var bsonIndex = 0;
    while (bsonIndex < data.length)
      bsonIndex = BSON.deserializeStream(data, bsonIndex, 1, docs, docs.length, { isArray: true });

    expect(docs.length).to.equal(1);
    done();
  });
});
