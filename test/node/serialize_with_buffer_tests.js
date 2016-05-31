var BSON = require('../../lib/bson/bson'),
  f = require('util').format,
  assert = require('assert');

var bson = new BSON();

/**
 * @ignore
 */
exports['correctly serialize into buffer using serializeWithBufferAndIndex'] = function(test) {
  // Create a buffer
  var b = new Buffer(256);
  // Serialize from index 0
  var r = bson.serializeWithBufferAndIndex({a:1}, false, b, 0, false, false);
  test.equal(11, r);

  // Serialize from index r+1
  var r = bson.serializeWithBufferAndIndex({a:1}, false, b, r + 1, false, false);
  test.equal(23, r);

  // Deserialize the buffers
  var doc = bson.deserialize(b.slice(0, 12));
  test.deepEqual({a:1}, doc);
  var doc = bson.deserialize(b.slice(12, 24));
  test.deepEqual({a:1}, doc);
  test.done();
}
