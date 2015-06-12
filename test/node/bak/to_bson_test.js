var mongodb = process.env['TEST_NATIVE'] != null ? require('../../lib/bson').native() : require('../../lib/bson').pure();

var testCase = require('nodeunit').testCase,
  mongoO = require('../../lib/bson').pure(),
  Buffer = require('buffer').Buffer,
  gleak = require('../../tools/gleak'),
  fs = require('fs'),
  BSON = mongoO.BSON,
  Code = mongoO.Code, 
  Binary = mongoO.Binary,
  Timestamp = mongoO.Timestamp,
  Long = mongoO.Long,
  MongoReply = mongoO.MongoReply,
  ObjectID = mongoO.ObjectID,
  Symbol = mongoO.Symbol,
  DBRef = mongoO.DBRef,
  Double = mongoO.Double,
  MinKey = mongoO.MinKey,
  MaxKey = mongoO.MaxKey,
  BinaryParser = mongoO.BinaryParser;

var BSONSE = mongodb,
  BSONDE = mongodb;

// for tests
BSONDE.BSON_BINARY_SUBTYPE_DEFAULT = 0;
BSONDE.BSON_BINARY_SUBTYPE_FUNCTION = 1;
BSONDE.BSON_BINARY_SUBTYPE_BYTE_ARRAY = 2;
BSONDE.BSON_BINARY_SUBTYPE_UUID = 3;
BSONDE.BSON_BINARY_SUBTYPE_MD5 = 4;
BSONDE.BSON_BINARY_SUBTYPE_USER_DEFINED = 128;          

BSONSE.BSON_BINARY_SUBTYPE_DEFAULT = 0;
BSONSE.BSON_BINARY_SUBTYPE_FUNCTION = 1;
BSONSE.BSON_BINARY_SUBTYPE_BYTE_ARRAY = 2;
BSONSE.BSON_BINARY_SUBTYPE_UUID = 3;
BSONSE.BSON_BINARY_SUBTYPE_MD5 = 4;
BSONSE.BSON_BINARY_SUBTYPE_USER_DEFINED = 128;          

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
	var serialized_data = new BSONSE.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
	var deserialized_doc = new BSONDE.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);	
	test.deepEqual({b:1}, deserialized_doc);

  // Serialize the data   
  var serialized_data = new mongoO.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
  var deserialized_doc = new mongoO.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);  
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
  var serialized_data = new BSONSE.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
  var deserialized_doc = new BSONDE.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);  
  test.deepEqual({e:1}, deserialized_doc.b);

  var serialized_data = new mongoO.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
  var deserialized_doc = new mongoO.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);  
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
  var serialized_data = new BSONSE.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
  var deserialized_doc = new BSONDE.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);  
  test.deepEqual("hello", deserialized_doc.b);

  // Serialize the data   
  var serialized_data = new mongoO.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
  var deserialized_doc = new mongoO.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);  
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
    var serialized_data = new mongoO.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);    
    var deserialized_doc = new mongoO.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);  
  } catch (err) {
    test1 = true;
  }

  try {
    var serialized_data = new BSONSE.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).serialize(doc, false, true);
    var deserialized_doc = new BSONDE.BSON([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]).deserialize(serialized_data);  
  } catch (err) {
    test2 = true;
  }

  test.equal(true, test1);
  test.equal(true, test2);
  test.done();
}
  
/**
 * Retrieve the server information for the current
 * instance of the db client
 * 
 * @ignore
 */
exports.noGlobalsLeaked = function(test) {
  var leaks = gleak.detectNew();
  test.equal(0, leaks.length, "global var leak detected: " + leaks.join(', '));
  test.done();
}
