"use strict"

var testCase = require('nodeunit').testCase,
  Buffer = require('buffer').Buffer,
  fs = require('fs'),
  BSON = require('../..'),
  Code = BSON.Code,
  BSONRegExp = BSON.BSONRegExp,
  Binary = BSON.Binary,
  Timestamp = BSON.Timestamp,
  Long = BSON.Long,
  MongoReply = BSON.MongoReply,
  ObjectID = BSON.ObjectID,
  ObjectId = BSON.ObjectID,
  Int32 = BSON.Int32,
  Symbol = BSON.Symbol,
  DBRef = BSON.DBRef,
  Double = BSON.Double,
  MinKey = BSON.MinKey,
  MaxKey = BSON.MaxKey,
  BinaryParser = require('../binary_parser').BinaryParser,
  vm = require('vm');

var createBSON = require('../utils');

// for tests
BSON.BSON_BINARY_SUBTYPE_DEFAULT = 0;
BSON.BSON_BINARY_SUBTYPE_FUNCTION = 1;
BSON.BSON_BINARY_SUBTYPE_BYTE_ARRAY = 2;
BSON.BSON_BINARY_SUBTYPE_UUID = 3;
BSON.BSON_BINARY_SUBTYPE_MD5 = 4;
BSON.BSON_BINARY_SUBTYPE_USER_DEFINED = 128;

BSON.BSON_BINARY_SUBTYPE_DEFAULT = 0;
BSON.BSON_BINARY_SUBTYPE_FUNCTION = 1;
BSON.BSON_BINARY_SUBTYPE_BYTE_ARRAY = 2;
BSON.BSON_BINARY_SUBTYPE_UUID = 3;
BSON.BSON_BINARY_SUBTYPE_MD5 = 4;
BSON.BSON_BINARY_SUBTYPE_USER_DEFINED = 128;

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
 * Module for parsing an ISO 8601 formatted string into a Date object.
 */
var ISODate = function (string) {
  var match;

	if (typeof string.getTime === "function")
		return string;
	else if (match = string.match(/^(\d{4})(-(\d{2})(-(\d{2})(T(\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|((\+|-)(\d{2}):(\d{2}))))?)?)?$/)) {
		var date = new Date();
		date.setUTCFullYear(Number(match[1]));
		date.setUTCMonth(Number(match[3]) - 1 || 0);
		date.setUTCDate(Number(match[5]) || 0);
		date.setUTCHours(Number(match[7]) || 0);
		date.setUTCMinutes(Number(match[8]) || 0);
		date.setUTCSeconds(Number(match[10]) || 0);
		date.setUTCMilliseconds(Number("." + match[12]) * 1000 || 0);

		if (match[13] && match[13] !== "Z") {
			var h = Number(match[16]) || 0,
			    m = Number(match[17]) || 0;

			h *= 3600000;
			m *= 60000;

			var offset = h + m;
			if (match[15] == "+")
				offset = -offset;

			date = new Date(date.valueOf() + offset);
		}

		return date;
	} else
		throw new Error("Invalid ISO 8601 date given.", __filename);
};

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
exports['Should Correctly Deserialize object with all wrapper types'] = function(test) {
  var bytes = [26,1,0,0,7,95,105,100,0,161,190,98,75,118,169,3,0,0,3,0,0,4,97,114,114,97,121,0,26,0,0,0,16,48,0,1,0,0,0,16,49,0,2,0,0,0,16,50,0,3,0,0,0,0,2,115,116,114,105,110,103,0,6,0,0,0,104,101,108,108,111,0,3,104,97,115,104,0,19,0,0,0,16,97,0,1,0,0,0,16,98,0,2,0,0,0,0,9,100,97,116,101,0,161,190,98,75,0,0,0,0,7,111,105,100,0,161,190,98,75,90,217,18,0,0,1,0,0,5,98,105,110,97,114,121,0,7,0,0,0,2,3,0,0,0,49,50,51,16,105,110,116,0,42,0,0,0,1,102,108,111,97,116,0,223,224,11,147,169,170,64,64,11,114,101,103,101,120,112,0,102,111,111,98,97,114,0,105,0,8,98,111,111,108,101,97,110,0,1,15,119,104,101,114,101,0,25,0,0,0,12,0,0,0,116,104,105,115,46,120,32,61,61,32,51,0,5,0,0,0,0,3,100,98,114,101,102,0,37,0,0,0,2,36,114,101,102,0,5,0,0,0,116,101,115,116,0,7,36,105,100,0,161,190,98,75,2,180,1,0,0,2,0,0,0,10,110,117,108,108,0,0];
  var serialized_data = '';

  // Convert to chars
  for(var i = 0; i < bytes.length; i++) {
    serialized_data = serialized_data + BinaryParser.fromByte(bytes[i]);
  }

  var object = createBSON().deserialize(new Buffer(serialized_data, 'binary'), {promoteValues:false});
  // Perform tests
  test.equal("hello", object.string);
  test.deepEqual([new Int32(1),new Int32(2),new Int32(3)], object.array);
  test.deepEqual(new Int32(1), object.hash.a);
  test.deepEqual(new Int32(2), object.hash.b);
  test.ok(object.date != null);
  test.ok(object.oid != null);
  test.ok(object.binary != null);
  test.deepEqual(new Int32(42), object.int);
  test.deepEqual(new Double(33.3333), object.float);
  test.ok(object.regexp != null);
  test.equal(true, object.boolean);
  test.ok(object.where != null);
  test.ok(object.dbref != null);
  test.ok(object[null] == null);
  test.done();
}
