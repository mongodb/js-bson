'use strict';

var createBSON = require('../utils');
var M = require('../../lib/bson/map');

function testSerializeAndDeserialize(test, expected) {
  var result;
  test.doesNotThrow(function() {
    var bson = createBSON();
    result = bson.deserialize(bson.serialize(expected));
  });
  test.deepEqual(result, expected);
}

exports['Should throw on an unknown _bsontype'] = function(test) {
  function myBsonType () {
    this.x = 12;
  }
  myBsonType.prototype._bsontype = 'myBsonType';

  test.throws(function() {
    createBSON().serialize({ a: new myBsonType() });
  });
  test.done();
}

exports['Should ignore _bsontype that is not on the prototype'] = function(test) {
  testSerializeAndDeserialize(test, { a: { _bsontype: 'foo' } });
  test.done();
}

exports['Should be able to handle serializing null and Object.create(null)'] = function(test) {
  testSerializeAndDeserialize(test, {
    a: null,
    b: Object.create(null)
  });
  test.done();
}

exports['Should throw on an unknown _bsontype in an array'] = function(test) {
  function myBsonType () {
    this.x = 12;
  }
  myBsonType.prototype._bsontype = 'myBsonType';

  test.throws(function() {
    createBSON().serialize({ a: [ new myBsonType() ] });
  });
  test.done();
}

exports['Should ingore _bsontype that is not on the prototype in an array'] = function(test) {
  testSerializeAndDeserialize(test, { a: [{ _bsontype: 'foo' }] });
  test.done();
}

exports['Should be able to handle serializing null and Object.create(null) in an array'] = function(test) {
  testSerializeAndDeserialize(test, {
    a: [
      null,
      Object.create(null)
    ]
  });
  test.done();
}

exports['Should throw on an unknown _bsontype in a Map'] = function(test) {
  function myBsonType () {
    this.x = 12;
  }
  myBsonType.prototype._bsontype = 'myBsonType';

  test.throws(function() {
    createBSON().serialize({ a: new M([ ['x', new myBsonType()] ]) });
  });
  test.done();
}

exports['Should ingore _bsontype that is not on the prototype in a Map'] = function(test) {
  var result;
  test.doesNotThrow(function() {
    var bson = createBSON();
    result = bson.deserialize(bson.serialize({ a: new M([[ '_bsontype', 'foo' ]]) }));
  });
  test.deepEqual(result, { a: { _bsontype: 'foo' } });
  test.done();
}

exports['Should be able to handle serializing null and Object.create(null) in a Map'] = function(test) {
  var result;
  test.doesNotThrow(function() {
    var bson = createBSON();
    result = bson.deserialize(bson.serialize({
      a: new M([
        ['a', null],
        ['b', Object.create(null)]
      ])
    }));
  });
  test.deepEqual(result, { a: { a: null, b: {} } });
  test.done();
}
