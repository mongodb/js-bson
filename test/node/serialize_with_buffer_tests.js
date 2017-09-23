'use strict';

var createBSON = require('../utils'),
  expect = require('chai').expect;

describe('serializeWithBuffer', function() {
  /**
   * @ignore
   */
  it('correctly serialize into buffer using serializeWithBufferAndIndex', function(done) {
    var bson = createBSON();
    // Create a buffer
    var b = new Buffer(256);
    // Serialize from index 0
    var r = bson.serializeWithBufferAndIndex({ a: 1 }, b);
    expect(11).to.equal(r);

    // Serialize from index r+1
    r = bson.serializeWithBufferAndIndex({ a: 1 }, b, {
      index: r + 1
    });
    expect(23).to.equal(r);

    // Deserialize the buffers
    var doc = bson.deserialize(b.slice(0, 12));
    expect({ a: 1 }).to.deep.equal(doc);
    doc = bson.deserialize(b.slice(12, 24));
    expect({ a: 1 }).to.deep.equal(doc);
    done();
  });
});
