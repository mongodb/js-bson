'use strict';

var BSON = require('../..'),
  ObjectID = BSON.ObjectID,
  createBSON = require('../utils');

// var hexStringToBinary = function(string) {
//   var numberofValues = string.length / 2;
//   var array = '';

//   for (var i = 0; i < numberofValues; i++) {
//     array += String.fromCharCode(parseInt(string[i * 2] + string[i * 2 + 1], 16));
//   }
//   return array;
// };

// var assertBuffersEqual = function(test, buffer1, buffer2) {
//   if (buffer1.length !== buffer2.length)
//     test.fail('Buffers do not have the same length', buffer1, buffer2);

//   for (var i = 0; i < buffer1.length; i++) {
//     test.equal(buffer1[i], buffer2[i]);
//   }
// };

/**
 * Retrieve the server information for the current
 * instance of the db client
 *
 * @ignore
 */
exports.setUp = function(callback) {
  callback();
};

/**
 * Retrieve the server information for the current
 * instance of the db client
 *
 * @ignore
 */
exports.tearDown = function(callback) {
  callback();
};

/**
 * @ignore
 */
exports['Should correctly handle toBson function for an object'] = function(test) {
  // Test object
  var doc = {
    hello: new ObjectID(),
    a: 1
  };

  // Add a toBson method to the object
  doc.toBSON = function() {
    return { b: 1 };
  };

  // Serialize the data
  var serialized_data = createBSON().serialize(doc, false, true);
  var deserialized_doc = createBSON().deserialize(serialized_data);
  test.deepEqual({ b: 1 }, deserialized_doc);

  // Serialize the data
  serialized_data = createBSON().serialize(doc, false, true);
  deserialized_doc = createBSON().deserialize(serialized_data);
  test.deepEqual({ b: 1 }, deserialized_doc);
  test.done();
};

/**
 * @ignore
 */
exports['Should correctly handle embedded toBson function for an object'] = function(test) {
  // Test object
  var doc = {
    hello: new ObjectID(),
    a: 1,
    b: {
      d: 1
    }
  };

  // Add a toBson method to the object
  doc.b.toBSON = function() {
    return { e: 1 };
  };

  // Serialize the data
  var serialized_data = createBSON().serialize(doc, false, true);
  var deserialized_doc = createBSON().deserialize(serialized_data);
  test.deepEqual({ e: 1 }, deserialized_doc.b);

  serialized_data = createBSON().serialize(doc, false, true);
  deserialized_doc = createBSON().deserialize(serialized_data);
  test.deepEqual({ e: 1 }, deserialized_doc.b);
  test.done();
};

/**
 * @ignore
 */
exports['Should correctly serialize when embedded non object returned by toBSON'] = function(test) {
  // Test object
  var doc = {
    hello: new ObjectID(),
    a: 1,
    b: {
      d: 1
    }
  };

  // Add a toBson method to the object
  doc.b.toBSON = function() {
    return 'hello';
  };

  // Serialize the data
  var serialized_data = createBSON().serialize(doc, false, true);
  var deserialized_doc = createBSON().deserialize(serialized_data);
  test.deepEqual('hello', deserialized_doc.b);

  // Serialize the data
  serialized_data = createBSON().serialize(doc, false, true);
  deserialized_doc = createBSON().deserialize(serialized_data);
  test.deepEqual('hello', deserialized_doc.b);
  test.done();
};

/**
 * @ignore
 */
exports['Should fail when top level object returns a non object type'] = function(test) {
  // Test object
  var doc = {
    hello: new ObjectID(),
    a: 1,
    b: {
      d: 1
    }
  };

  // Add a toBson method to the object
  doc.toBSON = function() {
    return 'hello';
  };

  var test1 = false;
  var test2 = false;

  try {
    var serialized_data = createBSON().serialize(doc, false, true);
    createBSON().deserialize(serialized_data);
  } catch (err) {
    test1 = true;
  }

  try {
    serialized_data = createBSON().serialize(doc, false, true);
    createBSON().deserialize(serialized_data);
  } catch (err) {
    test2 = true;
  }

  test.equal(true, test1);
  test.equal(true, test2);
  test.done();
};
