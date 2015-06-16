"use strict"

var sys = require('util'),
  fs = require('fs'),
  Buffer = require('buffer').Buffer,
  BSON = require('../../lib/bson/bson'),
  BinaryParser = require('../../lib/bson/binary_parser').BinaryParser,
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

// for tests
var BSON_BINARY_SUBTYPE_DEFAULT = 0;
var BSON_BINARY_SUBTYPE_FUNCTION = 1;
var BSON_BINARY_SUBTYPE_BYTE_ARRAY = 2;
var BSON_BINARY_SUBTYPE_UUID = 3;
var BSON_BINARY_SUBTYPE_MD5 = 4;
var BSON_BINARY_SUBTYPE_USER_DEFINED = 128;

var BSON_BINARY_SUBTYPE_DEFAULT = 0;
var BSON_BINARY_SUBTYPE_FUNCTION = 1;
var BSON_BINARY_SUBTYPE_BYTE_ARRAY = 2;
var BSON_BINARY_SUBTYPE_UUID = 3;
var BSON_BINARY_SUBTYPE_MD5 = 4;
var BSON_BINARY_SUBTYPE_USER_DEFINED = 128;

var hexStringToBinary = function(string) {
  var numberofValues = string.length / 2;
  var array = "";

  for(var i = 0; i < numberofValues; i++) {
    array += String.fromCharCode(parseInt(string[i*2] + string[i*2 + 1], 16));
  }
  return array;
}

var assertBuffersEqual = function(test, buffer1, buffer2) {
  if(buffer1.length != buffer2.length) test.fail("Buffers do not have the same length", buffer1, buffer2);

  for(var i = 0; i < buffer1.length; i++) {
    test.equal(buffer1[i], buffer2[i]);
  }
}

/**
 * Retrieve the server information for the current
 * instance of the db client
 *
 * @ignore
 */
exports.setUp = function(callback) {
  callback();
}

/**
 * Retrieve the server information for the current
 * instance of the db client
 *
 * @ignore
 */
exports.tearDown = function(callback) {
  callback();
}

/**
 * @ignore
 */
exports['Should correctly handle toBson function for an object'] = function(test) {
	// Test object
  var doc = {
		hello: new ObjectID(),
		a:1
	};

	// Add a toBson method to the object
	doc.toBSON = function() {
		return {b:1};
	}

	// Serialize the data
	var serialized_data = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
	var deserialized_doc = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);
	test.deepEqual({b:1}, deserialized_doc);

  // Serialize the data
  var serialized_data = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
  var deserialized_doc = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);
  test.deepEqual({b:1}, deserialized_doc);
  test.done();
}

/**
 * @ignore
 */
exports['Should correctly handle embedded toBson function for an object'] = function(test) {
  // Test object
  var doc = {
    hello: new ObjectID(),
    a:1,
    b: {
      d: 1
    }
  };

  // Add a toBson method to the object
  doc.b.toBSON = function() {
    return {e:1};
  }

  // Serialize the data
  var serialized_data = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
  var deserialized_doc = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);
  test.deepEqual({e:1}, deserialized_doc.b);

  var serialized_data = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
  var deserialized_doc = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);
  test.deepEqual({e:1}, deserialized_doc.b);
  test.done();
}

/**
 * @ignore
 */
exports['Should correctly serialize when embedded non object returned by toBSON'] = function(test) {
  // Test object
  var doc = {
    hello: new ObjectID(),
    a:1,
    b: {
      d: 1
    }
  };

  // Add a toBson method to the object
  doc.b.toBSON = function() {
    return "hello";
  }

  // Serialize the data
  var serialized_data = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
  var deserialized_doc = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);
  test.deepEqual("hello", deserialized_doc.b);

  // Serialize the data
  var serialized_data = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
  var deserialized_doc = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);
  test.deepEqual("hello", deserialized_doc.b);
  test.done();
}

/**
 * @ignore
 */
exports['Should fail when top level object returns a non object type'] = function(test) {
  // Test object
  var doc = {
    hello: new ObjectID(),
    a:1,
    b: {
      d: 1
    }
  };

  // Add a toBson method to the object
  doc.toBSON = function() {
    return "hello";
  }

  var test1 = false;
  var test2 = false;

  try {
    var serialized_data = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
    var deserialized_doc = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);
  } catch (err) {
    test1 = true;
  }

  try {
    var serialized_data = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
    var deserialized_doc = new BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);
  } catch (err) {
    test2 = true;
  }

  test.equal(true, test1);
  test.equal(true, test2);
  test.done();
}
