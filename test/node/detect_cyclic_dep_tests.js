"use strict"

var sys = require('util'),
  fs = require('fs'),
  Buffer = require('buffer').Buffer,
  BSONJS = require('../../lib/bson/bson'),
  BinaryParser = require('../binary_parser').BinaryParser,
  Long = require('../../lib/bson/long').Long,
  ObjectID = require('../../lib/bson/bson').ObjectID,
  Binary = require('../../lib/bson/bson').Binary,
  Code = require('../../lib/bson/bson').Code,
  DBRef = require('../../lib/bson/bson').DBRef,
  Symbol = require('../../lib/bson/bson').Symbol,
  Double = require('../../lib/bson/bson').Double,
  MaxKey = require('../../lib/bson/bson').MaxKey,
  MinKey = require('../../lib/bson/bson').MinKey,
  Timestamp = require('../../lib/bson/bson').Timestamp,
  gleak = require('../../tools/gleak'),
  assert = require('assert');

// Parsers
var bsonC = new BSONJS();
var bsonJS = new BSONJS();

exports.setUp = function(callback) {
  callback();
}

exports.tearDown = function(callback) {
  callback();
}

/**
 * @ignore
 */
exports['Should correctly detect cyclic dependency in nested objects'] = function(test) {
  // Force cyclic dependency
  var a = { b: {} };
  a.b.c = a;
  try {
    // Attempt to serialize cyclic dependency
    var serialized_data = bsonC.serialize(a)
  } catch(err) {
    assert.equal('cyclic dependency detected', err.message);
  }

  test.done();
}

/**
 * @ignore
 */
exports['Should correctly detect cyclic dependency in deeploy nested objects'] = function(test) {
  // Force cyclic dependency
  var a = { b: { c: [ { d: { } } ] } };
  a.b.c[0].d.a = a;

  try {
    // Attempt to serialize cyclic dependency
    var serialized_data = bsonC.serialize(a)
  } catch(err) {
    assert.equal('cyclic dependency detected', err.message);
  }

  test.done();
}

/**
 * @ignore
 */
exports['Should correctly detect cyclic dependency in nested array'] = function(test) {
  // Force cyclic dependency
  var a = { b: {} };
  a.b.c = [a];
  try {
    // Attempt to serialize cyclic dependency
    var serialized_data = bsonC.serialize(a)
  } catch(err) {
    assert.equal('cyclic dependency detected', err.message);
  }

  test.done();
}
