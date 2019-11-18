'use strict';

var Buffer = require('buffer').Buffer,
  fs = require('fs'),
  BSON = require('../..'),
  Code = BSON.Code,
  BSONRegExp = BSON.BSONRegExp,
  Binary = BSON.Binary,
  Timestamp = BSON.Timestamp,
  Long = BSON.Long,
  ObjectID = BSON.ObjectID,
  ObjectId = BSON.ObjectID,
  Symbol = BSON.Symbol,
  DBRef = BSON.DBRef,
  Decimal128 = BSON.Decimal128,
  Int32 = BSON.Int32,
  Double = BSON.Double,
  MinKey = BSON.MinKey,
  MaxKey = BSON.MaxKey,
  BinaryParser = require('../binary_parser').BinaryParser,
  vm = require('vm');

var createBSON = require('../utils');
var M = require('../../lib/bson/map');

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

// var hexStringToBinary = function(string) {
//   var numberofValues = string.length / 2;
//   var array = '';

//   for (var i = 0; i < numberofValues; i++) {
//     array += String.fromCharCode(parseInt(string[i * 2] + string[i * 2 + 1], 16));
//   }
//   return array;
// };

var assertBuffersEqual = function(test, buffer1, buffer2) {
  if (buffer1.length !== buffer2.length)
    test.fail('Buffers do not have the same length', buffer1, buffer2);

  for (var i = 0; i < buffer1.length; i++) {
    test.equal(buffer1[i], buffer2[i]);
  }
};

/**
 * Module for parsing an ISO 8601 formatted string into a Date object.
 */
var ISODate = function(string) {
  var match;

  if (typeof string.getTime === 'function') return string;
  else if (
    (match = string.match(
      /^(\d{4})(-(\d{2})(-(\d{2})(T(\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|((\+|-)(\d{2}):(\d{2}))))?)?)?$/
    ))
  ) {
    var date = new Date();
    date.setUTCFullYear(Number(match[1]));
    date.setUTCMonth(Number(match[3]) - 1 || 0);
    date.setUTCDate(Number(match[5]) || 0);
    date.setUTCHours(Number(match[7]) || 0);
    date.setUTCMinutes(Number(match[8]) || 0);
    date.setUTCSeconds(Number(match[10]) || 0);
    date.setUTCMilliseconds(Number('.' + match[12]) * 1000 || 0);

    if (match[13] && match[13] !== 'Z') {
      var h = Number(match[16]) || 0,
        m = Number(match[17]) || 0;

      h *= 3600000;
      m *= 60000;

      var offset = h + m;
      if (match[15] === '+') offset = -offset;

      date = new Date(date.valueOf() + offset);
    }

    return date;
  } else throw new Error('Invalid ISO 8601 date given.', __filename);
};

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
exports['Should Correctly convert ObjectID to itself'] = function(test) {
  var myObject, newObject;
  var selfConvertion = function() {
    myObject = new ObjectID();
    newObject = ObjectID(myObject);
  };

  test.doesNotThrow(selfConvertion);
  test.equal(myObject, newObject);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly get BSON types from require'] = function(test) {
  var _mongodb = require('../..');
  test.ok(_mongodb.ObjectID === ObjectID);
  test.ok(_mongodb.Binary === Binary);
  test.ok(_mongodb.Long === Long);
  test.ok(_mongodb.Timestamp === Timestamp);
  test.ok(_mongodb.Code === Code);
  test.ok(_mongodb.DBRef === DBRef);
  test.ok(_mongodb.Symbol === Symbol);
  test.ok(_mongodb.MinKey === MinKey);
  test.ok(_mongodb.MaxKey === MaxKey);
  test.ok(_mongodb.Double === Double);
  test.ok(_mongodb.Decimal128 === Decimal128);
  test.ok(_mongodb.Int32 === Int32);
  test.ok(_mongodb.BSONRegExp === BSONRegExp);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Deserialize object'] = function(test) {
  var bytes = [
    95,
    0,
    0,
    0,
    2,
    110,
    115,
    0,
    42,
    0,
    0,
    0,
    105,
    110,
    116,
    101,
    103,
    114,
    97,
    116,
    105,
    111,
    110,
    95,
    116,
    101,
    115,
    116,
    115,
    95,
    46,
    116,
    101,
    115,
    116,
    95,
    105,
    110,
    100,
    101,
    120,
    95,
    105,
    110,
    102,
    111,
    114,
    109,
    97,
    116,
    105,
    111,
    110,
    0,
    8,
    117,
    110,
    105,
    113,
    117,
    101,
    0,
    0,
    3,
    107,
    101,
    121,
    0,
    12,
    0,
    0,
    0,
    16,
    97,
    0,
    1,
    0,
    0,
    0,
    0,
    2,
    110,
    97,
    109,
    101,
    0,
    4,
    0,
    0,
    0,
    97,
    95,
    49,
    0,
    0
  ];
  var serialized_data = '';
  // Convert to chars
  for (var i = 0; i < bytes.length; i++) {
    serialized_data = serialized_data + BinaryParser.fromByte(bytes[i]);
  }

  var object = createBSON().deserialize(new Buffer(serialized_data, 'binary'));
  test.equal('a_1', object.name);
  test.equal(false, object.unique);
  test.equal(1, object.key.a);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Deserialize object with all types'] = function(test) {
  var bytes = [
    26,
    1,
    0,
    0,
    7,
    95,
    105,
    100,
    0,
    161,
    190,
    98,
    75,
    118,
    169,
    3,
    0,
    0,
    3,
    0,
    0,
    4,
    97,
    114,
    114,
    97,
    121,
    0,
    26,
    0,
    0,
    0,
    16,
    48,
    0,
    1,
    0,
    0,
    0,
    16,
    49,
    0,
    2,
    0,
    0,
    0,
    16,
    50,
    0,
    3,
    0,
    0,
    0,
    0,
    2,
    115,
    116,
    114,
    105,
    110,
    103,
    0,
    6,
    0,
    0,
    0,
    104,
    101,
    108,
    108,
    111,
    0,
    3,
    104,
    97,
    115,
    104,
    0,
    19,
    0,
    0,
    0,
    16,
    97,
    0,
    1,
    0,
    0,
    0,
    16,
    98,
    0,
    2,
    0,
    0,
    0,
    0,
    9,
    100,
    97,
    116,
    101,
    0,
    161,
    190,
    98,
    75,
    0,
    0,
    0,
    0,
    7,
    111,
    105,
    100,
    0,
    161,
    190,
    98,
    75,
    90,
    217,
    18,
    0,
    0,
    1,
    0,
    0,
    5,
    98,
    105,
    110,
    97,
    114,
    121,
    0,
    7,
    0,
    0,
    0,
    2,
    3,
    0,
    0,
    0,
    49,
    50,
    51,
    16,
    105,
    110,
    116,
    0,
    42,
    0,
    0,
    0,
    1,
    102,
    108,
    111,
    97,
    116,
    0,
    223,
    224,
    11,
    147,
    169,
    170,
    64,
    64,
    11,
    114,
    101,
    103,
    101,
    120,
    112,
    0,
    102,
    111,
    111,
    98,
    97,
    114,
    0,
    105,
    0,
    8,
    98,
    111,
    111,
    108,
    101,
    97,
    110,
    0,
    1,
    15,
    119,
    104,
    101,
    114,
    101,
    0,
    25,
    0,
    0,
    0,
    12,
    0,
    0,
    0,
    116,
    104,
    105,
    115,
    46,
    120,
    32,
    61,
    61,
    32,
    51,
    0,
    5,
    0,
    0,
    0,
    0,
    3,
    100,
    98,
    114,
    101,
    102,
    0,
    37,
    0,
    0,
    0,
    2,
    36,
    114,
    101,
    102,
    0,
    5,
    0,
    0,
    0,
    116,
    101,
    115,
    116,
    0,
    7,
    36,
    105,
    100,
    0,
    161,
    190,
    98,
    75,
    2,
    180,
    1,
    0,
    0,
    2,
    0,
    0,
    0,
    10,
    110,
    117,
    108,
    108,
    0,
    0
  ];
  var serialized_data = '';

  // Convert to chars
  for (var i = 0; i < bytes.length; i++) {
    serialized_data = serialized_data + BinaryParser.fromByte(bytes[i]);
  }

  var object = createBSON().deserialize(new Buffer(serialized_data, 'binary'));
  // Perform tests
  test.equal('hello', object.string);
  test.deepEqual([1, 2, 3], object.array);
  test.equal(1, object.hash.a);
  test.equal(2, object.hash.b);
  test.ok(object.date != null);
  test.ok(object.oid != null);
  test.ok(object.binary != null);
  test.equal(42, object.int);
  test.equal(33.3333, object.float);
  test.ok(object.regexp != null);
  test.equal(true, object.boolean);
  test.ok(object.where != null);
  test.ok(object.dbref != null);
  test.ok(object[null] == null);
  test.done();
};

/**
 * @ignore
 */
exports['Should Serialize and Deserialize String'] = function(test) {
  var test_string = { hello: 'world' };
  var serialized_data = createBSON().serialize(test_string, {
    checkKeys: false
  });

  createBSON().serializeWithBufferAndIndex(test_string, serialized_data, {
    checkKeys: false,
    index: 0
  });

  test.deepEqual(test_string, createBSON().deserialize(serialized_data));
  test.done();
};

/**
 * @ignore
 */
exports['Should Serialize and Deserialize Empty String'] = function(test) {
  var test_string = { hello: '' };
  var serialized_data = createBSON().serialize(test_string);
  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_string));
  createBSON().serializeWithBufferAndIndex(test_string, serialized_data2);

  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  test.deepEqual(test_string, createBSON().deserialize(serialized_data));
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Integer'] = function(test) {
  var test_number = { doc: 5 };

  var serialized_data = createBSON().serialize(test_number);
  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_number));
  createBSON().serializeWithBufferAndIndex(test_number, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  test.deepEqual(test_number, createBSON().deserialize(serialized_data));
  test.deepEqual(test_number, createBSON().deserialize(serialized_data2));
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize null value'] = function(test) {
  var test_null = { doc: null };
  var serialized_data = createBSON().serialize(test_null);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_null));
  createBSON().serializeWithBufferAndIndex(test_null, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var object = createBSON().deserialize(serialized_data);
  test.equal(null, object.doc);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Number 1'] = function(test) {
  var test_number = { doc: 5.5 };
  var serialized_data = createBSON().serialize(test_number);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_number));
  createBSON().serializeWithBufferAndIndex(test_number, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  test.deepEqual(test_number, createBSON().deserialize(serialized_data));
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Integer'] = function(test) {
  var test_int = { doc: 42 };
  var serialized_data = createBSON().serialize(test_int);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_int));
  createBSON().serializeWithBufferAndIndex(test_int, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  test.deepEqual(test_int.doc, createBSON().deserialize(serialized_data).doc);

  test_int = { doc: -5600 };
  serialized_data = createBSON().serialize(test_int);

  serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_int));
  createBSON().serializeWithBufferAndIndex(test_int, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  test.deepEqual(test_int.doc, createBSON().deserialize(serialized_data).doc);

  test_int = { doc: 2147483647 };
  serialized_data = createBSON().serialize(test_int);

  serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_int));
  createBSON().serializeWithBufferAndIndex(test_int, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  test.deepEqual(test_int.doc, createBSON().deserialize(serialized_data).doc);

  test_int = { doc: -2147483648 };
  serialized_data = createBSON().serialize(test_int);

  serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_int));
  createBSON().serializeWithBufferAndIndex(test_int, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  test.deepEqual(test_int.doc, createBSON().deserialize(serialized_data).doc);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Object'] = function(test) {
  var doc = { doc: { age: 42, name: 'Spongebob', shoe_size: 9.5 } };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  test.deepEqual(doc.doc.age, createBSON().deserialize(serialized_data).doc.age);
  test.deepEqual(doc.doc.name, createBSON().deserialize(serialized_data).doc.name);
  test.deepEqual(doc.doc.shoe_size, createBSON().deserialize(serialized_data).doc.shoe_size);
  test.done();
};

/**
 * @ignore
 */
exports['Should correctly ignore undefined values in arrays'] = function(test) {
  var doc = { doc: { notdefined: undefined } };
  var serialized_data = createBSON().serialize(doc, {
    ignoreUndefined: true
  });
  var serialized_data2 = new Buffer(
    createBSON().calculateObjectSize(doc, {
      ignoreUndefined: true
    })
  );
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2, {
    ignoreUndefined: true
  });

  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  var doc1 = createBSON().deserialize(serialized_data);

  test.deepEqual(undefined, doc1.doc.notdefined);
  test.done();
};

exports['Should correctly serialize undefined array entries as null values'] = function(test) {
  var doc = { doc: { notdefined: undefined }, a: [1, 2, undefined, 3] };
  var serialized_data = createBSON().serialize(doc, {
    ignoreUndefined: true
  });
  var serialized_data2 = new Buffer(
    createBSON().calculateObjectSize(doc, {
      ignoreUndefined: true
    })
  );
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2, {
    ignoreUndefined: true
  });
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  var doc1 = createBSON().deserialize(serialized_data);
  test.deepEqual(undefined, doc1.doc.notdefined);
  test.equal(null, doc1.a[2]);
  test.done();
};

exports['Should correctly serialize undefined array entries as undefined values'] = function(test) {
  var doc = { doc: { notdefined: undefined }, a: [1, 2, undefined, 3] };
  var serialized_data = createBSON().serialize(doc, {
    ignoreUndefined: false
  });
  var serialized_data2 = new Buffer(
    createBSON().calculateObjectSize(doc, {
      ignoreUndefined: false
    })
  );
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2, {
    ignoreUndefined: false
  });

  // console.log("======================================== 0")
  // console.log(serialized_data.toString('hex'))
  // console.log(serialized_data2.toString('hex'))

  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  var doc1 = createBSON().deserialize(serialized_data);
  var doc2 = createBSON().deserialize(serialized_data2);
  // console.log("======================================== 0")
  // console.dir(doc1)
  // console.dir(doc2)

  test.deepEqual(null, doc1.doc.notdefined);
  test.deepEqual(null, doc2.doc.notdefined);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Array'] = function(test) {
  var doc = { doc: [1, 2, 'a', 'b'] };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized = createBSON().deserialize(serialized_data);
  test.equal(doc.doc[0], deserialized.doc[0]);
  test.equal(doc.doc[1], deserialized.doc[1]);
  test.equal(doc.doc[2], deserialized.doc[2]);
  test.equal(doc.doc[3], deserialized.doc[3]);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Buffer'] = function(test) {
  var doc = { doc: new Buffer('hello world') };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized = createBSON().deserialize(serialized_data);
  test.ok(deserialized.doc instanceof Binary);
  test.equal('hello world', deserialized.doc.toString());
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Buffer with promoteBuffers option'] = function(
  test
) {
  var doc = { doc: new Buffer('hello world') };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized = createBSON().deserialize(serialized_data, {
    promoteBuffers: true
  });
  test.ok(deserialized.doc instanceof Buffer);
  test.equal('hello world', deserialized.doc.toString());
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Number 4'] = function(test) {
  var doc = { doc: BSON.BSON_INT32_MAX + 10 };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized = createBSON().deserialize(serialized_data);
  // test.ok(deserialized.doc instanceof Binary);
  test.equal(BSON.BSON_INT32_MAX + 10, deserialized.doc);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Array with added on functions'] = function(
  test
) {
  Array.prototype.toXml = function() {};
  var doc = { doc: [1, 2, 'a', 'b'] };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized = createBSON().deserialize(serialized_data);
  test.equal(doc.doc[0], deserialized.doc[0]);
  test.equal(doc.doc[1], deserialized.doc[1]);
  test.equal(doc.doc[2], deserialized.doc[2]);
  test.equal(doc.doc[3], deserialized.doc[3]);
  test.done();
};

/**
 * @ignore
 */
exports['Should correctly deserialize a nested object'] = function(test) {
  var doc = { doc: { doc: 1 } };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  test.deepEqual(doc.doc.doc, createBSON().deserialize(serialized_data).doc.doc);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize A Boolean'] = function(test) {
  var doc = { doc: true };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  test.equal(doc.doc, createBSON().deserialize(serialized_data).doc);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize a Date'] = function(test) {
  var date = new Date();
  //(2009, 11, 12, 12, 00, 30)
  date.setUTCDate(12);
  date.setUTCFullYear(2009);
  date.setUTCMonth(11 - 1);
  date.setUTCHours(12);
  date.setUTCMinutes(0);
  date.setUTCSeconds(30);
  var doc = { doc: date };
  var serialized_data = createBSON().serialize(doc);
  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);

  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var doc1 = createBSON().deserialize(serialized_data);
  test.deepEqual(doc, doc1);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize a Date from another VM'] = function(test) {
  var script = 'date1 = new Date();',
    ctx = vm.createContext({
      date1: null
    });
  vm.runInContext(script, ctx, 'myfile.vm');

  var date = ctx.date1;
  //(2009, 11, 12, 12, 00, 30)
  date.setUTCDate(12);
  date.setUTCFullYear(2009);
  date.setUTCMonth(11 - 1);
  date.setUTCHours(12);
  date.setUTCMinutes(0);
  date.setUTCSeconds(30);
  var doc = { doc: date };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  test.equal(doc.date, createBSON().deserialize(serialized_data).doc.date);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize nested doc'] = function(test) {
  var doc = {
    string: 'Strings are great',
    decimal: 3.14159265,
    bool: true,
    integer: 5,

    subObject: {
      moreText: 'Bacon ipsum dolor.',
      longKeylongKeylongKeylongKeylongKeylongKey: 'Pork belly.'
    },

    subArray: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    anotherString: 'another string'
  };

  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Oid'] = function(test) {
  var doc = { doc: new ObjectID() };
  // var doc2 = { doc: ObjectID.createFromHexString(doc.doc.toHexString()) };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  test.deepEqual(doc, createBSON().deserialize(serialized_data));
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly encode Empty Hash'] = function(test) {
  var doc = {};
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  test.deepEqual(doc, createBSON().deserialize(serialized_data));
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Ordered Hash'] = function(test) {
  var doc = { doc: { b: 1, a: 2, c: 3, d: 4 } };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var decoded_hash = createBSON().deserialize(serialized_data).doc;
  var keys = [];

  for (var name in decoded_hash) keys.push(name);
  test.deepEqual(['b', 'a', 'c', 'd'], keys);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Regular Expression'] = function(test) {
  // Serialize the regular expression
  var doc = { doc: /foobar/im };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var doc2 = createBSON().deserialize(serialized_data);

  test.deepEqual(doc.doc.toString(), doc2.doc.toString());
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize a Binary object'] = function(test) {
  var bin = new Binary();
  var string = 'binstring';
  for (var index = 0; index < string.length; index++) {
    bin.put(string.charAt(index));
  }

  var doc = { doc: bin };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);

  test.deepEqual(doc.doc.value(), deserialized_data.doc.value());
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize a Type 2 Binary object'] = function(test) {
  var bin = new Binary(new Buffer('binstring'), Binary.SUBTYPE_BYTE_ARRAY);
  var string = 'binstring';
  for (var index = 0; index < string.length; index++) {
    bin.put(string.charAt(index));
  }

  var doc = { doc: bin };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);

  test.deepEqual(doc.doc.value(), deserialized_data.doc.value());
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize a big Binary object'] = function(test) {
  var data = fs.readFileSync('test/node/data/test_gs_weird_bug.png', 'binary');
  var bin = new Binary();
  bin.write(data);
  var doc = { doc: bin };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);
  test.deepEqual(doc.doc.value(), deserialized_data.doc.value());
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize DBRef'] = function(test) {
  var oid = new ObjectID();
  var doc = { dbref: new DBRef('namespace', oid, null) };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var doc2 = createBSON().deserialize(serialized_data);
  test.equal('namespace', doc2.dbref.namespace);
  test.deepEqual(doc2.dbref.oid.toHexString(), oid.toHexString());
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize partial DBRef'] = function(test) {
  var id = new ObjectID();
  var doc = { name: 'something', user: { $ref: 'username', $id: id } };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var doc2 = createBSON().deserialize(serialized_data);
  test.equal('something', doc2.name);
  test.equal('username', doc2.user.namespace);
  test.equal(id.toString(), doc2.user.oid.toString());
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize simple Int'] = function(test) {
  var doc = { doc: 2147483648 };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var doc2 = createBSON().deserialize(serialized_data);
  test.deepEqual(doc.doc, doc2.doc);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Long Integer'] = function(test) {
  var doc = { doc: Long.fromNumber(9223372036854775807) };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);
  test.deepEqual(doc.doc, deserialized_data.doc);

  doc = { doc: Long.fromNumber(-9223372036854775) };
  serialized_data = createBSON().serialize(doc);
  deserialized_data = createBSON().deserialize(serialized_data);
  test.deepEqual(doc.doc, deserialized_data.doc);

  doc = { doc: Long.fromNumber(-9223372036854775809) };
  serialized_data = createBSON().serialize(doc);
  deserialized_data = createBSON().deserialize(serialized_data);
  test.deepEqual(doc.doc, deserialized_data.doc);
  test.done();
};

/**
 * @ignore
 */
exports['Should Deserialize Large Integers as Number not Long'] = function(test) {
  function roundTrip(val) {
    var doc = { doc: val };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(test, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    test.deepEqual(doc.doc, deserialized_data.doc);
  }

  roundTrip(Math.pow(2, 52));
  roundTrip(Math.pow(2, 53) - 1);
  roundTrip(Math.pow(2, 53));
  roundTrip(-Math.pow(2, 52));
  roundTrip(-Math.pow(2, 53) + 1);
  roundTrip(-Math.pow(2, 53));
  roundTrip(Math.pow(2, 65)); // Too big for Long.
  roundTrip(-Math.pow(2, 65));
  roundTrip(9223372036854775807);
  roundTrip(1234567890123456800); // Bigger than 2^53, stays a double.
  roundTrip(-1234567890123456800);
  test.done();
};

/**
 * @ignore
 */
exports[
  'Should Correctly Serialize and Deserialize Long Integer and Timestamp as different types'
] = function(test) {
  var long = Long.fromNumber(9223372036854775807);
  var timestamp = Timestamp.fromNumber(9223372036854775807);
  test.ok(long instanceof Long);
  test.ok(!(long instanceof Timestamp));
  test.ok(timestamp instanceof Timestamp);
  test.ok(!(timestamp instanceof Long));

  var test_int = { doc: long, doc2: timestamp };
  var serialized_data = createBSON().serialize(test_int);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_int));
  createBSON().serializeWithBufferAndIndex(test_int, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);
  test.deepEqual(test_int.doc, deserialized_data.doc);
  test.done();
};

/**
 * @ignore
 */
exports['Should Always put the id as the first item in a hash'] = function(test) {
  var hash = { doc: { not_id: 1, _id: 2 } };
  var serialized_data = createBSON().serialize(hash);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(hash));
  createBSON().serializeWithBufferAndIndex(hash, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);
  var keys = [];

  for (var name in deserialized_data.doc) {
    keys.push(name);
  }

  test.deepEqual(['not_id', '_id'], keys);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize a User defined Binary object'] = function(
  test
) {
  var bin = new Binary();
  bin.sub_type = BSON.BSON_BINARY_SUBTYPE_USER_DEFINED;
  var string = 'binstring';
  for (var index = 0; index < string.length; index++) {
    bin.put(string.charAt(index));
  }

  var doc = { doc: bin };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  var deserialized_data = createBSON().deserialize(serialized_data);

  test.deepEqual(deserialized_data.doc.sub_type, BSON.BSON_BINARY_SUBTYPE_USER_DEFINED);
  test.deepEqual(doc.doc.value(), deserialized_data.doc.value());
  test.done();
};

/**
 * @ignore
 */
exports['Should Correclty Serialize and Deserialize a Code object'] = function(test) {
  var doc = { doc: { doc2: new Code('this.a > i', { i: 1 }) } };
  var serialized_data = createBSON().serialize(doc);
  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);
  test.deepEqual(doc.doc.doc2.code, deserialized_data.doc.doc2.code);
  test.deepEqual(doc.doc.doc2.scope.i, deserialized_data.doc.doc2.scope.i);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly serialize and deserialize and embedded array'] = function(test) {
  var doc = {
    a: 0,
    b: [
      'tmp1',
      'tmp2',
      'tmp3',
      'tmp4',
      'tmp5',
      'tmp6',
      'tmp7',
      'tmp8',
      'tmp9',
      'tmp10',
      'tmp11',
      'tmp12',
      'tmp13',
      'tmp14',
      'tmp15',
      'tmp16'
    ]
  };

  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);
  test.deepEqual(doc.a, deserialized_data.a);
  test.deepEqual(doc.b, deserialized_data.b);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize UTF8'] = function(test) {
  // Serialize utf8
  var doc = {
    name: '本荘由利地域に洪水警報',
    name1: 'öüóőúéáűíÖÜÓŐÚÉÁŰÍ',
    name2: 'abcdedede',
    name3: '本荘由利地域に洪水警報',
    name4: 'abcdedede',
    本荘由利地域に洪水警報: '本荘由利地域に洪水警報',
    本荘由利地本荘由利地: {
      本荘由利地域に洪水警報: '本荘由利地域に洪水警報',
      地域に洪水警報本荘由利: '本荘由利地域に洪水警報',
      洪水警報本荘地域に洪水警報本荘由利: '本荘由利地域に洪水警報'
    }
  };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);
  test.deepEqual(doc, deserialized_data);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize query object'] = function(test) {
  var doc = { count: 'remove_with_no_callback_bug_test', query: {}, fields: null };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);
  test.deepEqual(doc, deserialized_data);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize empty query object'] = function(test) {
  var doc = {};
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);
  test.deepEqual(doc, deserialized_data);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize array based doc'] = function(test) {
  var doc = { b: [1, 2, 3], _id: new ObjectID() };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);
  test.deepEqual(doc.b, deserialized_data.b);
  test.deepEqual(doc, deserialized_data);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize and Deserialize Symbol'] = function(test) {
  if (Symbol != null) {
    var doc = { b: [new Symbol('test')] };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(test, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    test.deepEqual(doc.b, deserialized_data.b);
    test.deepEqual(doc, deserialized_data);
    test.ok(deserialized_data.b[0] instanceof Symbol);
  }

  test.done();
};

/**
 * @ignore
 */
exports['Should handle Deeply nested document'] = function(test) {
  var doc = { a: { b: { c: { d: 2 } } } };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var deserialized_data = createBSON().deserialize(serialized_data);
  test.deepEqual(doc, deserialized_data);
  test.done();
};

/**
 * @ignore
 */
exports['Should handle complicated all typed object'] = function(test) {
  // First doc
  var date = new Date();
  var oid = new ObjectID();
  var string = 'binstring';
  var bin = new Binary();
  for (var index = 0; index < string.length; index++) {
    bin.put(string.charAt(index));
  }

  var doc = {
    string: 'hello',
    array: [1, 2, 3],
    hash: { a: 1, b: 2 },
    date: date,
    oid: oid,
    binary: bin,
    int: 42,
    float: 33.3333,
    regexp: /regexp/,
    boolean: true,
    long: date.getTime(),
    where: new Code('this.a > i', { i: 1 }),
    dbref: new DBRef('namespace', oid, 'integration_tests_')
  };

  // Second doc
  oid = new ObjectID.createFromHexString(oid.toHexString());
  string = 'binstring';
  bin = new Binary();
  for (index = 0; index < string.length; index++) {
    bin.put(string.charAt(index));
  }

  var doc2 = {
    string: 'hello',
    array: [1, 2, 3],
    hash: { a: 1, b: 2 },
    date: date,
    oid: oid,
    binary: bin,
    int: 42,
    float: 33.3333,
    regexp: /regexp/,
    boolean: true,
    long: date.getTime(),
    where: new Code('this.a > i', { i: 1 }),
    dbref: new DBRef('namespace', oid, 'integration_tests_')
  };

  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  serialized_data2 = createBSON().serialize(doc2, false, true);

  for (var i = 0; i < serialized_data2.length; i++) {
    require('assert').equal(serialized_data2[i], serialized_data[i]);
  }

  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize Complex Nested Object'] = function(test) {
  var doc = {
    email: 'email@email.com',
    encrypted_password: 'password',
    friends: ['4db96b973d01205364000006', '4dc77b24c5ba38be14000002'],
    location: [72.4930088, 23.0431957],
    name: 'Amit Kumar',
    password_salt: 'salty',
    profile_fields: [],
    username: 'amit',
    _id: new ObjectID()
  };

  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var doc2 = doc;
  doc2._id = ObjectID.createFromHexString(doc2._id.toHexString());
  serialized_data2 = createBSON().serialize(doc2, false, true);

  for (var i = 0; i < serialized_data2.length; i++) {
    require('assert').equal(serialized_data2[i], serialized_data[i]);
  }

  test.done();
};

/**
 * @ignore
 */
exports['Should correctly massive doc'] = function(test) {
  var oid1 = new ObjectID();
  var oid2 = new ObjectID();

  // JS doc
  var doc = {
    dbref2: new DBRef('namespace', oid1, 'integration_tests_'),
    _id: oid2
  };

  var doc2 = {
    dbref2: new DBRef(
      'namespace',
      ObjectID.createFromHexString(oid1.toHexString()),
      'integration_tests_'
    ),
    _id: new ObjectID.createFromHexString(oid2.toHexString())
  };

  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  serialized_data2 = createBSON().serialize(doc2, false, true);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize/Deserialize regexp object'] = function(test) {
  var doc = { b: /foobaré/ };

  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  serialized_data2 = createBSON().serialize(doc);

  for (var i = 0; i < serialized_data2.length; i++) {
    require('assert').equal(serialized_data2[i], serialized_data[i]);
  }

  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize/Deserialize complicated object'] = function(test) {
  var doc = { a: { b: { c: [new ObjectID(), new ObjectID()] } }, d: { f: 1332.3323 } };

  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var doc2 = createBSON().deserialize(serialized_data);

  test.deepEqual(doc, doc2);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize/Deserialize nested object'] = function(test) {
  var doc = {
    _id: { date: new Date(), gid: '6f35f74d2bea814e21000000' },
    value: {
      b: { countries: { '--': 386 }, total: 1599 },
      bc: { countries: { '--': 3 }, total: 10 },
      gp: { countries: { '--': 2 }, total: 13 },
      mgc: { countries: { '--': 2 }, total: 14 }
    }
  };

  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var doc2 = createBSON().deserialize(serialized_data);

  test.deepEqual(doc, doc2);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize/Deserialize nested object with even more nesting'] = function(
  test
) {
  var doc = {
    _id: { date: { a: 1, b: 2, c: new Date() }, gid: '6f35f74d2bea814e21000000' },
    value: {
      b: { countries: { '--': 386 }, total: 1599 },
      bc: { countries: { '--': 3 }, total: 10 },
      gp: { countries: { '--': 2 }, total: 13 },
      mgc: { countries: { '--': 2 }, total: 14 }
    }
  };

  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var doc2 = createBSON().deserialize(serialized_data);
  test.deepEqual(doc, doc2);
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly Serialize empty name object'] = function(test) {
  var doc = {
    '': 'test',
    bbbb: 1
  };
  var serialized_data = createBSON().serialize(doc);
  var doc2 = createBSON().deserialize(serialized_data);
  test.equal(doc2[''], 'test');
  test.equal(doc2['bbbb'], 1);
  test.done();
};

/**
 * @ignore
 */
exports[
  'Should Correctly handle Forced Doubles to ensure we allocate enough space for cap collections'
] = function(test) {
  if (Double != null) {
    var doubleValue = new Double(100);
    var doc = { value: doubleValue };

    // Serialize
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(test, serialized_data, serialized_data2, 0);

    var doc2 = createBSON().deserialize(serialized_data);
    test.deepEqual({ value: 100 }, doc2);
  }

  test.done();
};

/**
 * @ignore
 */
exports['Should deserialize correctly'] = function(test) {
  var doc = {
    _id: new ObjectID('4e886e687ff7ef5e00000162'),
    str: 'foreign',
    type: 2,
    timestamp: ISODate('2011-10-02T14:00:08.383Z'),
    links: [
      'http://www.reddit.com/r/worldnews/comments/kybm0/uk_home_secretary_calls_for_the_scrapping_of_the/'
    ]
  };

  var serialized_data = createBSON().serialize(doc);
  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  var doc2 = createBSON().deserialize(serialized_data);

  test.deepEqual(JSON.stringify(doc), JSON.stringify(doc2));
  test.done();
};

/**
 * @ignore
 */
exports['Should correctly serialize and deserialize MinKey and MaxKey values'] = function(test) {
  var doc = {
    _id: new ObjectID('4e886e687ff7ef5e00000162'),
    minKey: new MinKey(),
    maxKey: new MaxKey()
  };

  var serialized_data = createBSON().serialize(doc);
  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  var doc2 = createBSON().deserialize(serialized_data);

  // Peform equality checks
  test.equal(JSON.stringify(doc), JSON.stringify(doc2));
  test.ok(doc._id.equals(doc2._id));
  // process.exit(0)
  test.ok(doc2.minKey instanceof MinKey);
  test.ok(doc2.maxKey instanceof MaxKey);
  test.done();
};

/**
 * @ignore
 */
exports['Should correctly serialize Double value'] = function(test) {
  var doc = {
    value: new Double(34343.2222)
  };

  var serialized_data = createBSON().serialize(doc);
  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);
  var doc2 = createBSON().deserialize(serialized_data);

  test.ok(doc.value.valueOf(), doc2.value);
  test.ok(doc.value.value, doc2.value);
  test.done();
};

/**
 * @ignore
 */
exports['ObjectID should correctly create objects'] = function(test) {
  try {
    ObjectID.createFromHexString('000000000000000000000001');
    ObjectID.createFromHexString('00000000000000000000001');
    test.ok(false);
  } catch (err) {
    test.ok(err != null);
  }

  test.done();
};

/**
 * @ignore
 */
exports['ObjectID should correctly retrieve timestamp'] = function(test) {
  var testDate = new Date();
  var object1 = new ObjectID();
  test.equal(
    Math.floor(testDate.getTime() / 1000),
    Math.floor(object1.getTimestamp().getTime() / 1000)
  );
  test.done();
};

/**
 * @ignore
 */
exports['Should Correctly throw error on bsonparser errors'] = function(test) {
  var data = new Buffer(3);
  var parser = createBSON();

  // Catch to small buffer error
  try {
    parser.deserialize(data);
    test.ok(false);
  } catch (err) {
    test.ok(true);
  }

  data = new Buffer(5);
  data[0] = 0xff;
  data[1] = 0xff;
  // Catch illegal size
  try {
    parser.deserialize(data);
    test.ok(false);
  } catch (err) {
    test.ok(true);
  }

  // Finish up
  test.done();
};

/**
 * A simple example showing the usage of BSON.calculateObjectSize function returning the number of BSON bytes a javascript object needs.
 *
 * @_class bson
 * @_function BSON.calculateObjectSize
 * @ignore
 */
exports['Should correctly calculate the size of a given javascript object'] = function(test) {
  // Create a simple object
  var doc = { a: 1, func: function() {} };
  var bson = createBSON();
  // Calculate the size of the object without serializing the function
  var size = bson.calculateObjectSize(doc, {
    serializeFunctions: false
  });
  test.equal(12, size);
  // Calculate the size of the object serializing the function
  size = bson.calculateObjectSize(doc, {
    serializeFunctions: true
  });
  // Validate the correctness
  test.equal(37, size);
  test.done();
};

/**
 * A simple example showing the usage of BSON.calculateObjectSize function returning the number of BSON bytes a javascript object needs.
 *
 * @_class bson
 * @_function calculateObjectSize
 * @ignore
 */
exports[
  'Should correctly calculate the size of a given javascript object using instance method'
] = function(test) {
  // Create a simple object
  var doc = { a: 1, func: function() {} };
  // Create a BSON parser instance
  var bson = createBSON();
  // Calculate the size of the object without serializing the function
  var size = bson.calculateObjectSize(doc, {
    serializeFunctions: false
  });
  test.equal(12, size);
  // Calculate the size of the object serializing the function
  size = bson.calculateObjectSize(doc, {
    serializeFunctions: true
  });
  // Validate the correctness
  test.equal(37, size);
  test.done();
};

/**
 * A simple example showing the usage of BSON.serializeWithBufferAndIndex function.
 *
 * @_class bson
 * @_function BSON.serializeWithBufferAndIndex
 * @ignore
 */
exports['Should correctly serializeWithBufferAndIndex a given javascript object'] = function(test) {
  // Create a simple object
  var doc = { a: 1, func: function() {} };
  var bson = createBSON();
  // Calculate the size of the document, no function serialization
  var size = bson.calculateObjectSize(doc, {
    serializeFunctions: false
  });

  // Allocate a buffer
  var buffer = new Buffer(size);
  // Serialize the object to the buffer, checking keys and not serializing functions
  var index = bson.serializeWithBufferAndIndex(doc, buffer, {
    serializeFunctions: false,
    index: 0
  });

  // Validate the correctness
  test.equal(12, size);
  test.equal(11, index);

  // Serialize with functions
  // Calculate the size of the document, no function serialization
  size = bson.calculateObjectSize(doc, {
    serializeFunctions: true
  });
  // Allocate a buffer
  buffer = new Buffer(size);
  // Serialize the object to the buffer, checking keys and not serializing functions
  index = bson.serializeWithBufferAndIndex(doc, buffer, {
    serializeFunctions: true,
    index: 0
  });
  // Validate the correctness
  test.equal(37, size);
  test.equal(36, index);
  test.done();
};

/**
 * A simple example showing the usage of BSON.serializeWithBufferAndIndex function.
 *
 * @_class bson
 * @_function serializeWithBufferAndIndex
 * @ignore
 */
exports[
  'Should correctly serializeWithBufferAndIndex a given javascript object using a BSON instance'
] = function(test) {
  // Create a simple object
  var doc = { a: 1, func: function() {} };
  // Create a BSON parser instance
  var bson = createBSON();
  // Calculate the size of the document, no function serialization
  var size = bson.calculateObjectSize(doc, {
    serializeFunctions: false
  });
  // Allocate a buffer
  var buffer = new Buffer(size);
  // Serialize the object to the buffer, checking keys and not serializing functions
  var index = bson.serializeWithBufferAndIndex(doc, buffer, {
    serializeFunctions: false
  });
  // Validate the correctness
  test.equal(12, size);
  test.equal(11, index);

  // Serialize with functions
  // Calculate the size of the document, no function serialization
  size = bson.calculateObjectSize(doc, {
    serializeFunctions: true
  });
  // Allocate a buffer
  buffer = new Buffer(size);
  // Serialize the object to the buffer, checking keys and not serializing functions
  index = bson.serializeWithBufferAndIndex(doc, buffer, {
    serializeFunctions: true
  });
  // Validate the correctness
  test.equal(37, size);
  test.equal(36, index);
  test.done();
};

/**
 * A simple example showing the usage of BSON.serialize function returning serialized BSON Buffer object.
 *
 * @_class bson
 * @_function BSON.serialize
 * @ignore
 */
exports['Should correctly serialize a given javascript object'] = function(test) {
  // Create a simple object
  var doc = { a: 1, func: function() {} };
  // Create a BSON parser instance
  var bson = createBSON();
  // Serialize the object to a buffer, checking keys and not serializing functions
  var buffer = bson.serialize(doc, {
    checkKeys: true,
    serializeFunctions: false
  });
  // Validate the correctness
  test.equal(12, buffer.length);

  // Serialize the object to a buffer, checking keys and serializing functions
  buffer = bson.serialize(doc, {
    checkKeys: true,
    serializeFunctions: true
  });
  // Validate the correctness
  test.equal(37, buffer.length);
  test.done();
};

/**
 * A simple example showing the usage of BSON.serialize function returning serialized BSON Buffer object.
 *
 * @_class bson
 * @_function serialize
 * @ignore
 */
exports['Should correctly serialize a given javascript object using a bson instance'] = function(
  test
) {
  // Create a simple object
  var doc = { a: 1, func: function() {} };
  // Create a BSON parser instance
  var bson = createBSON();
  // Serialize the object to a buffer, checking keys and not serializing functions
  var buffer = bson.serialize(doc, {
    checkKeys: true,
    serializeFunctions: false
  });
  // Validate the correctness
  test.equal(12, buffer.length);

  // Serialize the object to a buffer, checking keys and serializing functions
  buffer = bson.serialize(doc, {
    checkKeys: true,
    serializeFunctions: true
  });
  // Validate the correctness
  test.equal(37, buffer.length);
  test.done();
};

// /**
//  * A simple example showing the usage of BSON.deserialize function returning a deserialized Javascript function.
//  *
//  * @_class bson
//  * @_function BSON.deserialize
//  * @ignore
//  */
//  exports['Should correctly deserialize a buffer using the BSON class level parser'] = function(test) {
//   // Create a simple object
//   var doc = {a: 1, func:function(){ console.log('hello world'); }}
//   // Create a BSON parser instance
//   var bson = createBSON();
//   // Serialize the object to a buffer, checking keys and serializing functions
//   var buffer = bson.serialize(doc, {
//     checkKeys: true,
//     serializeFunctions: true
//   });
//   // Validate the correctness
//   test.equal(65, buffer.length);
//
//   // Deserialize the object with no eval for the functions
//   var deserializedDoc = bson.deserialize(buffer);
//   // Validate the correctness
//   test.equal('object', typeof deserializedDoc.func);
//   test.equal(1, deserializedDoc.a);
//
//   // Deserialize the object with eval for the functions caching the functions
//   deserializedDoc = bson.deserialize(buffer, {evalFunctions:true, cacheFunctions:true});
//   // Validate the correctness
//   test.equal('function', typeof deserializedDoc.func);
//   test.equal(1, deserializedDoc.a);
//   test.done();
// }

// /**
//  * A simple example showing the usage of BSON instance deserialize function returning a deserialized Javascript function.
//  *
//  * @_class bson
//  * @_function deserialize
//  * @ignore
//  */
// exports['Should correctly deserialize a buffer using the BSON instance parser'] = function(test) {
//   // Create a simple object
//   var doc = {a: 1, func:function(){ console.log('hello world'); }}
//   // Create a BSON parser instance
//   var bson = createBSON();
//   // Serialize the object to a buffer, checking keys and serializing functions
//   var buffer = bson.serialize(doc, true, true, true);
//   // Validate the correctness
//   test.equal(65, buffer.length);
//
//   // Deserialize the object with no eval for the functions
//   var deserializedDoc = bson.deserialize(buffer);
//   // Validate the correctness
//   test.equal('object', typeof deserializedDoc.func);
//   test.equal(1, deserializedDoc.a);
//
//   // Deserialize the object with eval for the functions caching the functions
//   deserializedDoc = bson.deserialize(buffer, {evalFunctions:true, cacheFunctions:true});
//   // Validate the correctness
//   test.equal('function', typeof deserializedDoc.func);
//   test.equal(1, deserializedDoc.a);
//   test.done();
// }

// /**
//  * A simple example showing the usage of BSON.deserializeStream function returning deserialized Javascript objects.
//  *
//  * @_class bson
//  * @_function BSON.deserializeStream
//  * @ignore
//  */
// exports['Should correctly deserializeStream a buffer object'] = function(test) {
//   // Create a simple object
//   var doc = {a: 1, func:function(){ console.log('hello world'); }}
//   var bson = createBSON();
//   // Serialize the object to a buffer, checking keys and serializing functions
//   var buffer = bson.serialize(doc, {
//     checkKeys: true,
//     serializeFunctions: true
//   });
//   // Validate the correctness
//   test.equal(65, buffer.length);
//
//   // The array holding the number of retuned documents
//   var documents = new Array(1);
//   // Deserialize the object with no eval for the functions
//   var index = bson.deserializeStream(buffer, 0, 1, documents, 0);
//   // Validate the correctness
//   test.equal(65, index);
//   test.equal(1, documents.length);
//   test.equal(1, documents[0].a);
//   test.equal('object', typeof documents[0].func);
//
//   // Deserialize the object with eval for the functions caching the functions
//   // The array holding the number of retuned documents
//   var documents = new Array(1);
//   // Deserialize the object with no eval for the functions
//   var index = bson.deserializeStream(buffer, 0, 1, documents, 0, {evalFunctions:true, cacheFunctions:true});
//   // Validate the correctness
//   test.equal(65, index);
//   test.equal(1, documents.length);
//   test.equal(1, documents[0].a);
//   test.equal('function', typeof documents[0].func);
//   test.done();
// }

// /**
//  * A simple example showing the usage of BSON instance deserializeStream function returning deserialized Javascript objects.
//  *
//  * @_class bson
//  * @_function deserializeStream
//  * @ignore
//  */
// exports['Should correctly deserializeStream a buffer object'] = function(test) {
//   // Create a simple object
//   var doc = {a: 1, func:function(){ console.log('hello world'); }}
//   // Create a BSON parser instance
//   var bson = createBSON();
//   // Serialize the object to a buffer, checking keys and serializing functions
//   var buffer = bson.serialize(doc, true, true, true);
//   // Validate the correctness
//   test.equal(65, buffer.length);
//
//   // The array holding the number of retuned documents
//   var documents = new Array(1);
//   // Deserialize the object with no eval for the functions
//   var index = bson.deserializeStream(buffer, 0, 1, documents, 0);
//   // Validate the correctness
//   test.equal(65, index);
//   test.equal(1, documents.length);
//   test.equal(1, documents[0].a);
//   test.equal('object', typeof documents[0].func);
//
//   // Deserialize the object with eval for the functions caching the functions
//   // The array holding the number of retuned documents
//   var documents = new Array(1);
//   // Deserialize the object with no eval for the functions
//   var index = bson.deserializeStream(buffer, 0, 1, documents, 0, {evalFunctions:true, cacheFunctions:true});
//   // Validate the correctness
//   test.equal(65, index);
//   test.equal(1, documents.length);
//   test.equal(1, documents[0].a);
//   test.equal('function', typeof documents[0].func);
//   test.done();
// }

/**
 * @ignore
 */
exports['ObjectID should have a correct cached representation of the hexString'] = function(test) {
  ObjectID.cacheHexString = true;
  var a = new ObjectID();
  var __id = a.__id;
  test.equal(__id, a.toHexString());

  // hexString
  a = new ObjectID(__id);
  test.equal(__id, a.toHexString());

  // fromHexString
  a = ObjectID.createFromHexString(__id);
  test.equal(a.__id, a.toHexString());
  test.equal(__id, a.toHexString());

  // number
  var genTime = a.generationTime;
  a = new ObjectID(genTime);
  __id = a.__id;
  test.equal(__id, a.toHexString());

  // generationTime
  delete a.__id;
  a.generationTime = genTime;
  test.equal(__id, a.toHexString());

  // createFromTime
  a = ObjectId.createFromTime(genTime);
  __id = a.__id;
  test.equal(__id, a.toHexString());
  ObjectId.cacheHexString = false;

  test.done();
};

/**
 * @ignore
 */
exports['Should fail to create ObjectID due to illegal hex code'] = function(test) {
  try {
    new ObjectID('zzzzzzzzzzzzzzzzzzzzzzzz');
    test.ok(false);
  } catch (err) {
    test.ok(true);
  }

  test.equal(false, ObjectID.isValid(null));
  test.equal(false, ObjectID.isValid({}));
  test.equal(false, ObjectID.isValid({ length: 12 }));
  test.equal(false, ObjectID.isValid([]));
  test.equal(false, ObjectID.isValid(true));
  test.equal(true, ObjectID.isValid(0));
  test.equal(false, ObjectID.isValid('invalid'));
  test.equal(true, ObjectID.isValid('zzzzzzzzzzzz'));
  test.equal(false, ObjectID.isValid('zzzzzzzzzzzzzzzzzzzzzzzz'));
  test.equal(true, ObjectID.isValid('000000000000000000000000'));
  test.equal(true, ObjectID.isValid(new ObjectID('thisis12char')));

  var tmp = new ObjectID();
  // Cloning tmp so that instanceof fails to fake import from different version/instance of the same npm package
  var objectIdLike = {
    id: tmp.id,
    toHexString: function() {
      return tmp.toHexString();
    }
  };

  test.equal(true, tmp.equals(objectIdLike));
  test.equal(true, tmp.equals(new ObjectId(objectIdLike)));
  test.equal(true, ObjectID.isValid(objectIdLike));

  test.done();
};

/**
 * @ignore
 */
exports['Should correctly serialize the BSONRegExp type'] = function(test) {
  var doc = { regexp: new BSONRegExp('test', 'i') };
  var doc1 = { regexp: /test/i };
  var serialized_data = createBSON().serialize(doc);
  // var serialized_data3 = createBSON().serialize(doc1);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  doc1 = createBSON().deserialize(serialized_data);
  var regexp = new RegExp('test', 'i');
  test.deepEqual(regexp, doc1.regexp);
  test.done();
};

/**
 * @ignore
 */
exports['Should correctly deserialize the BSONRegExp type'] = function(test) {
  var doc = { regexp: new BSONRegExp('test', 'i') };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  var doc1 = createBSON().deserialize(serialized_data, { bsonRegExp: true });
  test.ok(doc1.regexp instanceof BSONRegExp);
  test.equal('test', doc1.regexp.pattern);
  test.equal('i', doc1.regexp.options);
  test.done();
};

/**
 * @ignore
 */
exports['Should return boolean for ObjectID equality check'] = function(test) {
  var id = new ObjectID();
  test.equal(true, id.equals(new ObjectID(id.toString())));
  test.equal(true, id.equals(id.toString()));
  test.equal(false, id.equals('1234567890abcdef12345678'));
  test.equal(false, id.equals('zzzzzzzzzzzzzzzzzzzzzzzz'));
  test.equal(false, id.equals('foo'));
  test.equal(false, id.equals(null));
  test.equal(false, id.equals(undefined));
  test.done();
};

/**
 * @ignore
 */
exports['Should correctly serialize MinKey from another library version'] = function(test) {
  // clone the class defn to simulate another library sending us a MinKey instance
  // note that the 1.x library tests need to run on Node 0.12.48 which doesn't support 
  // the JS "class" keyword so the 4.x defn of MinKey was ported to pre-ES5 syntax.
  function MinKey4x() {
    this.toExtendedJSON = function() {
      return { $minKey: 1 };
    }
  };
  MinKey4x.prototype.fromExtendedJSON = function() {
    return new MinKey4x();
  }
  MinKey4x.prototype._bsontype = 'MinKey';

  var doc = {
    _id: new ObjectId('4e886e687ff7ef5e00000162'),
    minKey: new MinKey4x()
  };

  var serialized_data = createBSON().serialize(doc);
  var doc2 = createBSON().deserialize(serialized_data);

  // Ensure that MinKey can be round-tripped through the serializer (see #310)
  test.ok(doc2.minKey instanceof MinKey);
  test.done();
};

/**
 * @ignore
 */
exports['Should serialize _bsontype=ObjectID (capital D) from v4.0.0/4.0.1'] = function(test) {
  // The ObjectId implementation in /4x-interop was copied from 4.0.1 to ensure that interop works
  // In 4.0.0 and 4.0.1, ObjectID._bsontype was changed to 'ObjectId' (lowercase "d"). 
  // This broke interop with 1.x. Releases after 4.0.1 reverted back to use _bsontype==='ObjectID',
  // which fixed interop with 1.x, but because we had to rev 1.x anyways to fix #310 for interop
  // with MinKey, it made sense to also fix interop with 4.0.0/4.0.1 ObjectId.
  // The ObjectId implementation in /4x-interop was copied from 4.0.1 source and slightly modified
  // so it could run the Node 0.12 tests where class, const, let, etc. are not supported.
  var ObjectId401 = require('./4x-interop/objectid');
  var id = new ObjectId401();
  var doc = { _id: id };
  var serialized_data = createBSON().serialize(doc);

  var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
  createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
  assertBuffersEqual(test, serialized_data, serialized_data2, 0);

  test.equal(doc._id.toHexString(), createBSON().deserialize(serialized_data)._id.toHexString());
  test.done();
};

exports['should throw if invalid BSON types are input to BSON serializer'] = function(test) {
  var oid = new ObjectId('111111111111111111111111');
  var badBsonType = new ObjectId('111111111111111111111111');
  badBsonType._bsontype = 'bogus';
  var badDoc = { bad: badBsonType };
  var badArray = [oid, badDoc];
  var badMap = new M([['a', badBsonType], ['b', badDoc], ['c', badArray]]);
  var BSON = createBSON();
  test.throws(function() {
    BSON.serialize(badDoc);
  });
  test.throws(function() {
    BSON.serialize(badArray);
  });
  test.throws(function() {
    BSON.serialize(badMap);
  });
  test.done();
}
