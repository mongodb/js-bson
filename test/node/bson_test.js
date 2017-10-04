'use strict';

var Buffer = require('buffer').Buffer,
  fs = require('fs'),
  expect = require('chai').expect,
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

var assertBuffersEqual = function(done, buffer1, buffer2) {
  if (buffer1.length !== buffer2.length) {
    done('Buffers do not have the same length', buffer1, buffer2);
  }

  for (var i = 0; i < buffer1.length; i++) {
    expect(buffer1[i]).to.equal(buffer2[i]);
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

describe('BSON', function() {
  /**
   * @ignore
   */
  it('Should Correctly convert ObjectID to itself', function(done) {
    var myObject, newObject;
    var selfConvertion = function() {
      myObject = new ObjectID();
      newObject = ObjectID(myObject);
    };

    expect(selfConvertion).to.not.throw;
    expect(myObject).to.equal(newObject);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly get BSON types from require', function(done) {
    var _mongodb = require('../..');
    expect(_mongodb.ObjectID === ObjectID).to.be.ok;
    expect(_mongodb.Binary === Binary).to.be.ok;
    expect(_mongodb.Long === Long).to.be.ok;
    expect(_mongodb.Timestamp === Timestamp).to.be.ok;
    expect(_mongodb.Code === Code).to.be.ok;
    expect(_mongodb.DBRef === DBRef).to.be.ok;
    expect(_mongodb.Symbol === Symbol).to.be.ok;
    expect(_mongodb.MinKey === MinKey).to.be.ok;
    expect(_mongodb.MaxKey === MaxKey).to.be.ok;
    expect(_mongodb.Double === Double).to.be.ok;
    expect(_mongodb.Decimal128 === Decimal128).to.be.ok;
    expect(_mongodb.Int32 === Int32).to.be.ok;
    expect(_mongodb.BSONRegExp === BSONRegExp).to.be.ok;
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Deserialize object', function(done) {
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
    expect('a_1').to.equal(object.name);
    expect(false).to.equal(object.unique);
    expect(1).to.equal(object.key.a);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Deserialize object with all types', function(done) {
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
    expect('hello').to.equal(object.string);
    expect([1, 2, 3]).to.deep.equal(object.array);
    expect(1).to.equal(object.hash.a);
    expect(2).to.equal(object.hash.b);
    expect(object.date != null).to.be.ok;
    expect(object.oid != null).to.be.ok;
    expect(object.binary != null).to.be.ok;
    expect(42).to.equal(object.int);
    expect(33.3333).to.equal(object.float);
    expect(object.regexp != null).to.be.ok;
    expect(true).to.equal(object.boolean);
    expect(object.where != null).to.be.ok;
    expect(object.dbref != null).to.be.ok;
    expect(object[null] == null).to.be.ok;
    done();
  });

  /**
   * @ignore
   */
  it('Should Serialize and Deserialize String', function(done) {
    var test_string = { hello: 'world' };
    var serialized_data = createBSON().serialize(test_string, {
      checkKeys: false
    });

    createBSON().serializeWithBufferAndIndex(test_string, serialized_data, {
      checkKeys: false,
      index: 0
    });

    expect(test_string).to.deep.equal(createBSON().deserialize(serialized_data));
    done();
  });

  /**
   * @ignore
   */
  it('Should Serialize and Deserialize Empty String', function(done) {
    var test_string = { hello: '' };
    var serialized_data = createBSON().serialize(test_string);
    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_string));
    createBSON().serializeWithBufferAndIndex(test_string, serialized_data2);

    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(test_string).to.deep.equal(createBSON().deserialize(serialized_data));
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Integer', function(done) {
    var test_number = { doc: 5 };

    var serialized_data = createBSON().serialize(test_number);
    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_number));
    createBSON().serializeWithBufferAndIndex(test_number, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(test_number).to.deep.equal(createBSON().deserialize(serialized_data));
    expect(test_number).to.deep.equal(createBSON().deserialize(serialized_data2));
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize null value', function(done) {
    var test_null = { doc: null };
    var serialized_data = createBSON().serialize(test_null);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_null));
    createBSON().serializeWithBufferAndIndex(test_null, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var object = createBSON().deserialize(serialized_data);
    expect(null).to.equal(object.doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Number 1', function(done) {
    var test_number = { doc: 5.5 };
    var serialized_data = createBSON().serialize(test_number);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_number));
    createBSON().serializeWithBufferAndIndex(test_number, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    expect(test_number).to.deep.equal(createBSON().deserialize(serialized_data));
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Integer', function(done) {
    var test_int = { doc: 42 };
    var serialized_data = createBSON().serialize(test_int);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_int));
    createBSON().serializeWithBufferAndIndex(test_int, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(test_int.doc).to.deep.equal(createBSON().deserialize(serialized_data).doc);

    test_int = { doc: -5600 };
    serialized_data = createBSON().serialize(test_int);

    serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_int));
    createBSON().serializeWithBufferAndIndex(test_int, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(test_int.doc).to.deep.equal(createBSON().deserialize(serialized_data).doc);

    test_int = { doc: 2147483647 };
    serialized_data = createBSON().serialize(test_int);

    serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_int));
    createBSON().serializeWithBufferAndIndex(test_int, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(test_int.doc).to.deep.equal(createBSON().deserialize(serialized_data).doc);

    test_int = { doc: -2147483648 };
    serialized_data = createBSON().serialize(test_int);

    serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_int));
    createBSON().serializeWithBufferAndIndex(test_int, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(test_int.doc).to.deep.equal(createBSON().deserialize(serialized_data).doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Object', function(done) {
    var doc = { doc: { age: 42, name: 'Spongebob', shoe_size: 9.5 } };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    expect(doc.doc.age).to.deep.equal(createBSON().deserialize(serialized_data).doc.age);
    expect(doc.doc.name).to.deep.equal(createBSON().deserialize(serialized_data).doc.name);
    expect(doc.doc.shoe_size).to.deep.equal(
      createBSON().deserialize(serialized_data).doc.shoe_size
    );

    done();
  });

  /**
   * @ignore
   */
  it('Should correctly ignore undefined values in arrays', function(done) {
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

    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc1 = createBSON().deserialize(serialized_data);

    expect(undefined).to.deep.equal(doc1.doc.notdefined);
    done();
  });

  it('Should correctly serialize undefined array entries as null values', function(done) {
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
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc1 = createBSON().deserialize(serialized_data);
    expect(undefined).to.deep.equal(doc1.doc.notdefined);
    expect(null).to.equal(doc1.a[2]);
    done();
  });

  it('Should correctly serialize undefined array entries as undefined values', function(done) {
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

    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc1 = createBSON().deserialize(serialized_data);
    var doc2 = createBSON().deserialize(serialized_data2);
    // console.log("======================================== 0")
    // console.dir(doc1)
    // console.dir(doc2)

    expect(null).to.deep.equal(doc1.doc.notdefined);
    expect(null).to.deep.equal(doc2.doc.notdefined);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Array', function(done) {
    var doc = { doc: [1, 2, 'a', 'b'] };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized = createBSON().deserialize(serialized_data);
    expect(doc.doc[0]).to.equal(deserialized.doc[0]);
    expect(doc.doc[1]).to.equal(deserialized.doc[1]);
    expect(doc.doc[2]).to.equal(deserialized.doc[2]);
    expect(doc.doc[3]).to.equal(deserialized.doc[3]);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Buffer', function(done) {
    var doc = { doc: new Buffer('hello world') };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized = createBSON().deserialize(serialized_data);
    expect(deserialized.doc instanceof Binary).to.be.ok;
    expect('hello world').to.equal(deserialized.doc.toString());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Buffer with promoteBuffers option', function(
    done
  ) {
    var doc = { doc: new Buffer('hello world') };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized = createBSON().deserialize(serialized_data, {
      promoteBuffers: true
    });
    expect(deserialized.doc instanceof Buffer).to.be.ok;
    expect('hello world').to.equal(deserialized.doc.toString());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Number 4', function(done) {
    var doc = { doc: BSON.BSON_INT32_MAX + 10 };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized = createBSON().deserialize(serialized_data);
    // expect(deserialized.doc instanceof Binary).to.be.ok;
    expect(BSON.BSON_INT32_MAX + 10).to.equal(deserialized.doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Array with added on functions', function(done) {
    Array.prototype.toXml = function() {};
    var doc = { doc: [1, 2, 'a', 'b'] };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized = createBSON().deserialize(serialized_data);
    expect(doc.doc[0]).to.equal(deserialized.doc[0]);
    expect(doc.doc[1]).to.equal(deserialized.doc[1]);
    expect(doc.doc[2]).to.equal(deserialized.doc[2]);
    expect(doc.doc[3]).to.equal(deserialized.doc[3]);
    done();
  });

  /**
   * @ignore
   */
  it('Should correctly deserialize a nested object', function(done) {
    var doc = { doc: { doc: 1 } };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    expect(doc.doc.doc).to.deep.equal(createBSON().deserialize(serialized_data).doc.doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize A Boolean', function(done) {
    var doc = { doc: true };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    expect(doc.doc).to.equal(createBSON().deserialize(serialized_data).doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize a Date', function(done) {
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

    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc1 = createBSON().deserialize(serialized_data);
    expect(doc).to.deep.equal(doc1);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize a Date from another VM', function(done) {
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
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(doc.date).to.equal(createBSON().deserialize(serialized_data).doc.date);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize nested doc', function(done) {
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
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Oid', function(done) {
    var doc = { doc: new ObjectID() };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    expect(doc).to.deep.equal(createBSON().deserialize(serialized_data));
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly encode Empty Hash', function(done) {
    var doc = {};
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    expect(doc).to.deep.equal(createBSON().deserialize(serialized_data));
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Ordered Hash', function(done) {
    var doc = { doc: { b: 1, a: 2, c: 3, d: 4 } };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var decoded_hash = createBSON().deserialize(serialized_data).doc;
    var keys = [];

    for (var name in decoded_hash) keys.push(name);
    expect(['b', 'a', 'c', 'd']).to.deep.equal(keys);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Regular Expression', function(done) {
    // Serialize the regular expression
    var doc = { doc: /foobar/im };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = createBSON().deserialize(serialized_data);

    expect(doc.doc.toString()).to.deep.equal(doc2.doc.toString());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize a Binary object', function(done) {
    var bin = new Binary();
    var string = 'binstring';
    for (var index = 0; index < string.length; index++) {
      bin.put(string.charAt(index));
    }

    var doc = { doc: bin };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);

    expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize a Type 2 Binary object', function(done) {
    var bin = new Binary(new Buffer('binstring'), Binary.SUBTYPE_BYTE_ARRAY);
    var string = 'binstring';
    for (var index = 0; index < string.length; index++) {
      bin.put(string.charAt(index));
    }

    var doc = { doc: bin };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);

    expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize a big Binary object', function(done) {
    var data = fs.readFileSync('test/node/data/test_gs_weird_bug.png', 'binary');
    var bin = new Binary();
    bin.write(data);
    var doc = { doc: bin };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize DBRef', function(done) {
    var oid = new ObjectID();
    var doc = { dbref: new DBRef('namespace', oid, null, {}) };
    var b = createBSON();

    var serialized_data = b.serialize(doc);
    var serialized_data2 = new Buffer(b.calculateObjectSize(doc));
    b.serializeWithBufferAndIndex(doc, serialized_data2);
    expect(serialized_data).to.deep.equal(serialized_data2);

    var doc2 = b.deserialize(serialized_data);
    expect(doc).to.deep.equal(doc2);
    expect(doc2.dbref.oid.toHexString()).to.deep.equal(oid.toHexString());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize partial DBRef', function(done) {
    var id = new ObjectID();
    var doc = { name: 'something', user: { $ref: 'username', $id: id } };
    var b = createBSON();
    var serialized_data = b.serialize(doc);

    var serialized_data2 = new Buffer(b.calculateObjectSize(doc));
    b.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = b.deserialize(serialized_data);
    expect('something').to.equal(doc2.name);
    expect('username').to.equal(doc2.user.collection);
    expect(id.toString()).to.equal(doc2.user.oid.toString());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize simple Int', function(done) {
    var doc = { doc: 2147483648 };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = createBSON().deserialize(serialized_data);
    expect(doc.doc).to.deep.equal(doc2.doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Long Integer', function(done) {
    var doc = { doc: Long.fromNumber(9223372036854775807) };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc.doc).to.deep.equal(deserialized_data.doc);

    doc = { doc: Long.fromNumber(-9223372036854775) };
    serialized_data = createBSON().serialize(doc);
    deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc.doc).to.deep.equal(deserialized_data.doc);

    doc = { doc: Long.fromNumber(-9223372036854775809) };
    serialized_data = createBSON().serialize(doc);
    deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc.doc).to.deep.equal(deserialized_data.doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Deserialize Large Integers as Number not Long', function(done) {
    function roundTrip(val) {
      var doc = { doc: val };
      var serialized_data = createBSON().serialize(doc);

      var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
      createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = createBSON().deserialize(serialized_data);
      expect(doc.doc).to.deep.equal(deserialized_data.doc);
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
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Timestamp as subclass of Long', function(done) {
    var long = Long.fromNumber(9223372036854775807);
    var timestamp = Timestamp.fromNumber(9223372036854775807);
    expect(long instanceof Long).to.be.ok;
    expect(!(long instanceof Timestamp)).to.be.ok;
    expect(timestamp instanceof Timestamp).to.be.ok;
    expect(timestamp instanceof Long).to.be.ok;

    var test_int = { doc: long, doc2: timestamp };
    var serialized_data = createBSON().serialize(test_int);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(test_int));
    createBSON().serializeWithBufferAndIndex(test_int, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    expect(test_int.doc).to.deep.equal(deserialized_data.doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Always put the id as the first item in a hash', function(done) {
    var hash = { doc: { not_id: 1, _id: 2 } };
    var serialized_data = createBSON().serialize(hash);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(hash));
    createBSON().serializeWithBufferAndIndex(hash, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    var keys = [];

    for (var name in deserialized_data.doc) {
      keys.push(name);
    }

    expect(['not_id', '_id']).to.deep.equal(keys);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize a User defined Binary object', function(done) {
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
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var deserialized_data = createBSON().deserialize(serialized_data);

    expect(deserialized_data.doc.sub_type).to.deep.equal(BSON.BSON_BINARY_SUBTYPE_USER_DEFINED);
    expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correclty Serialize and Deserialize a Code object', function(done) {
    var doc = { doc: { doc2: new Code('this.a > i', { i: 1 }) } };
    var serialized_data = createBSON().serialize(doc);
    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc.doc.doc2.code).to.deep.equal(deserialized_data.doc.doc2.code);
    expect(doc.doc.doc2.scope.i).to.deep.equal(deserialized_data.doc.doc2.scope.i);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly serialize and deserialize and embedded array', function(done) {
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
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc.a).to.deep.equal(deserialized_data.a);
    expect(doc.b).to.deep.equal(deserialized_data.b);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize UTF8', function(done) {
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
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc).to.deep.equal(deserialized_data);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize query object', function(done) {
    var doc = { count: 'remove_with_no_callback_bug_test', query: {}, fields: null };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc).to.deep.equal(deserialized_data);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize empty query object', function(done) {
    var doc = {};
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc).to.deep.equal(deserialized_data);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize array based doc', function(done) {
    var doc = { b: [1, 2, 3], _id: new ObjectID() };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc.b).to.deep.equal(deserialized_data.b);
    expect(doc).to.deep.equal(deserialized_data);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Symbol', function(done) {
    if (Symbol != null) {
      // symbols are deprecated, so upgrade to strings... so I'm not sure
      // we really need this test anymore...
      //var doc = { b: [new Symbol('test')] };

      var doc = { b: ['test'] };
      var serialized_data = createBSON().serialize(doc);
      var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
      createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = createBSON().deserialize(serialized_data);
      expect(doc).to.deep.equal(deserialized_data);
      expect(typeof deserialized_data.b[0]).to.equal('string');
    }

    done();
  });

  /**
   * @ignore
   */
  it('Should handle Deeply nested document', function(done) {
    var doc = { a: { b: { c: { d: 2 } } } };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = createBSON().deserialize(serialized_data);
    expect(doc).to.deep.equal(deserialized_data);
    done();
  });

  /**
   * @ignore
   */
  it('Should handle complicated all typed object', function(done) {
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

    expect(serialized_data).to.deep.equal(serialized_data2);

    serialized_data2 = createBSON().serialize(doc2, false, true);

    expect(serialized_data).to.deep.equal(serialized_data2);

    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize Complex Nested Object', function(done) {
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
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = doc;
    doc2._id = ObjectID.createFromHexString(doc2._id.toHexString());
    serialized_data2 = createBSON().serialize(doc2, false, true);

    for (var i = 0; i < serialized_data2.length; i++) {
      require('assert').equal(serialized_data2[i], serialized_data[i]);
    }

    done();
  });

  /**
   * @ignore
   */
  it('Should correctly massive doc', function(done) {
    var oid1 = new ObjectID();
    var oid2 = new ObjectID();

    var b = createBSON();

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

    var serialized_data = b.serialize(doc);
    var serialized_data2 = new Buffer(b.calculateObjectSize(doc));
    b.serializeWithBufferAndIndex(doc, serialized_data2);
    expect(serialized_data).to.deep.equal(serialized_data2);

    serialized_data2 = b.serialize(doc2, false, true);
    expect(serialized_data).to.deep.equal(serialized_data2);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize/Deserialize regexp object', function(done) {
    var doc = { b: /foobaré/ };

    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    serialized_data2 = createBSON().serialize(doc);

    for (var i = 0; i < serialized_data2.length; i++) {
      require('assert').equal(serialized_data2[i], serialized_data[i]);
    }

    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize/Deserialize complicated object', function(done) {
    var doc = { a: { b: { c: [new ObjectID(), new ObjectID()] } }, d: { f: 1332.3323 } };

    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = createBSON().deserialize(serialized_data);

    expect(doc).to.deep.equal(doc2);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize/Deserialize nested object', function(done) {
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
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = createBSON().deserialize(serialized_data);

    expect(doc).to.deep.equal(doc2);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize/Deserialize nested object with even more nesting', function(done) {
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
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = createBSON().deserialize(serialized_data);
    expect(doc).to.deep.equal(doc2);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize empty name object', function(done) {
    var doc = {
      '': 'test',
      bbbb: 1
    };
    var serialized_data = createBSON().serialize(doc);
    var doc2 = createBSON().deserialize(serialized_data);
    expect(doc2['']).to.equal('test');
    expect(doc2['bbbb']).to.equal(1);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly handle Forced Doubles to ensure we allocate enough space for cap collections', function(
    done
  ) {
    if (Double != null) {
      var doubleValue = new Double(100);
      var doc = { value: doubleValue };

      // Serialize
      var serialized_data = createBSON().serialize(doc);

      var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
      createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var doc2 = createBSON().deserialize(serialized_data);
      expect({ value: 100 }).to.deep.equal(doc2);
    }

    done();
  });

  /**
   * @ignore
   */
  it('Should deserialize correctly', function(done) {
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
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc2 = createBSON().deserialize(serialized_data);

    expect(JSON.stringify(doc)).to.deep.equal(JSON.stringify(doc2));
    done();
  });

  /**
   * @ignore
   */
  it('Should correctly serialize and deserialize MinKey and MaxKey values', function(done) {
    var doc = {
      _id: new ObjectID('4e886e687ff7ef5e00000162'),
      minKey: new MinKey(),
      maxKey: new MaxKey()
    };

    var serialized_data = createBSON().serialize(doc);
    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc2 = createBSON().deserialize(serialized_data);

    // Peform equality checks
    expect(JSON.stringify(doc)).to.equal(JSON.stringify(doc2));
    expect(doc._id.equals(doc2._id)).to.be.ok;
    // process.exit(0)
    expect(doc2.minKey instanceof MinKey).to.be.ok;
    expect(doc2.maxKey instanceof MaxKey).to.be.ok;
    done();
  });

  /**
   * @ignore
   */
  it('Should correctly serialize Double value', function(done) {
    var doc = {
      value: new Double(34343.2222)
    };

    var serialized_data = createBSON().serialize(doc);
    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc2 = createBSON().deserialize(serialized_data);

    expect(doc.value.valueOf(), doc2.value).to.be.ok;
    expect(doc.value.value, doc2.value).to.be.ok;
    done();
  });

  /**
   * @ignore
   */
  it('ObjectID should correctly create objects', function(done) {
    try {
      ObjectID.createFromHexString('000000000000000000000001');
      ObjectID.createFromHexString('00000000000000000000001');
      expect(false).to.be.ok;
    } catch (err) {
      expect(err != null).to.be.ok;
    }

    done();
  });

  /**
   * @ignore
   */
  it('ObjectID should correctly retrieve timestamp', function(done) {
    var testDate = new Date();
    var object1 = new ObjectID();
    expect(Math.floor(testDate.getTime() / 1000)).to.equal(
      Math.floor(object1.getTimestamp().getTime() / 1000)
    );

    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly throw error on bsonparser errors', function(done) {
    var data = new Buffer(3);
    var parser = createBSON();

    expect(() => {
      parser.deserialize(data);
    }).to.throw();

    data = new Buffer(5);
    data[0] = 0xff;
    data[1] = 0xff;
    expect(() => {
      parser.deserialize(data);
    }).to.throw();

    // Finish up
    done();
  });

  /**
   * A simple example showing the usage of BSON.calculateObjectSize function returning the number of BSON bytes a javascript object needs.
   *
   * @_class bson
   * @_function BSON.calculateObjectSize
   * @ignore
   */
  it('Should correctly calculate the size of a given javascript object', function(done) {
    // Create a simple object
    var doc = { a: 1, func: function() {} };
    var bson = createBSON();
    // Calculate the size of the object without serializing the function
    var size = bson.calculateObjectSize(doc, {
      serializeFunctions: false
    });
    expect(12).to.equal(size);
    // Calculate the size of the object serializing the function
    size = bson.calculateObjectSize(doc, {
      serializeFunctions: true
    });
    // Validate the correctness
    expect(37).to.equal(size);
    done();
  });

  /**
   * A simple example showing the usage of BSON.calculateObjectSize function returning the number of BSON bytes a javascript object needs.
   *
   * @_class bson
   * @_function calculateObjectSize
   * @ignore
   */
  it('Should correctly calculate the size of a given javascript object using instance method', function(
    done
  ) {
    // Create a simple object
    var doc = { a: 1, func: function() {} };
    // Create a BSON parser instance
    var bson = createBSON();
    // Calculate the size of the object without serializing the function
    var size = bson.calculateObjectSize(doc, {
      serializeFunctions: false
    });
    expect(12).to.equal(size);
    // Calculate the size of the object serializing the function
    size = bson.calculateObjectSize(doc, {
      serializeFunctions: true
    });
    // Validate the correctness
    expect(37).to.equal(size);
    done();
  });

  /**
   * A simple example showing the usage of BSON.serializeWithBufferAndIndex function.
   *
   * @_class bson
   * @_function BSON.serializeWithBufferAndIndex
   * @ignore
   */
  it('Should correctly serializeWithBufferAndIndex a given javascript object', function(done) {
    // Create a simple object
    var doc = { a: 1, func: function() {} };
    var bson = createBSON();

    // Calculate the size of the document, no function serialization
    var size = bson.calculateObjectSize(doc, { serializeFunctions: false });
    var buffer = new Buffer(size);
    // Serialize the object to the buffer, checking keys and not serializing functions
    var index = bson.serializeWithBufferAndIndex(doc, buffer, {
      serializeFunctions: false,
      index: 0
    });

    // Validate the correctness
    expect(size).to.equal(12);
    expect(index).to.equal(11);

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
    expect(37).to.equal(size);
    expect(36).to.equal(index);
    done();
  });

  /**
   * A simple example showing the usage of BSON.serializeWithBufferAndIndex function.
   *
   * @_class bson
   * @_function serializeWithBufferAndIndex
   * @ignore
   */
  it('Should correctly serializeWithBufferAndIndex a given javascript object using a BSON instance', function(
    done
  ) {
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

    expect(size).to.equal(12);
    expect(index).to.equal(11);

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
    expect(size).to.equal(37);
    expect(index).to.equal(36);

    done();
  });

  /**
   * A simple example showing the usage of BSON.serialize function returning serialized BSON Buffer object.
   *
   * @_class bson
   * @_function BSON.serialize
   * @ignore
   */
  it('Should correctly serialize a given javascript object', function(done) {
    // Create a simple object
    var doc = { a: 1, func: function() {} };
    // Create a BSON parser instance
    var bson = createBSON();

    var buffer = bson.serialize(doc, {
      checkKeys: true,
      serializeFunctions: false
    });

    expect(buffer.length).to.equal(12);

    // Serialize the object to a buffer, checking keys and serializing functions
    buffer = bson.serialize(doc, {
      checkKeys: true,
      serializeFunctions: true
    });
    // Validate the correctness
    expect(buffer.length).to.equal(37);

    done();
  });

  /**
   * A simple example showing the usage of BSON.serialize function returning serialized BSON Buffer object.
   *
   * @_class bson
   * @_function serialize
   * @ignore
   */
  it('Should correctly serialize a given javascript object using a bson instance', function(done) {
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
    expect(buffer.length).to.equal(12);

    // Serialize the object to a buffer, checking keys and serializing functions
    buffer = bson.serialize(doc, {
      checkKeys: true,
      serializeFunctions: true
    });
    // Validate the correctness
    expect(37).to.equal(buffer.length);

    done();
  });

  // /**
  //  * A simple example showing the usage of BSON.deserialize function returning a deserialized Javascript function.
  //  *
  //  * @_class bson
  //  * @_function BSON.deserialize
  //  * @ignore
  //  */
  //  it('Should correctly deserialize a buffer using the BSON class level parser', function(done) {
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
  //   expect(65).to.equal(buffer.length);
  //
  //   // Deserialize the object with no eval for the functions
  //   var deserializedDoc = bson.deserialize(buffer);
  //   // Validate the correctness
  //   expect('object').to.equal(typeof deserializedDoc.func);
  //   expect(1).to.equal(deserializedDoc.a);
  //
  //   // Deserialize the object with eval for the functions caching the functions
  //   deserializedDoc = bson.deserialize(buffer, {evalFunctions:true, cacheFunctions:true});
  //   // Validate the correctness
  //   expect('function').to.equal(typeof deserializedDoc.func);
  //   expect(1).to.equal(deserializedDoc.a);
  //   done();
  // }

  // /**
  //  * A simple example showing the usage of BSON instance deserialize function returning a deserialized Javascript function.
  //  *
  //  * @_class bson
  //  * @_function deserialize
  //  * @ignore
  //  */
  // it('Should correctly deserialize a buffer using the BSON instance parser', function(done) {
  //   // Create a simple object
  //   var doc = {a: 1, func:function(){ console.log('hello world'); }}
  //   // Create a BSON parser instance
  //   var bson = createBSON();
  //   // Serialize the object to a buffer, checking keys and serializing functions
  //   var buffer = bson.serialize(doc, true, true, true);
  //   // Validate the correctness
  //   expect(65).to.equal(buffer.length);
  //
  //   // Deserialize the object with no eval for the functions
  //   var deserializedDoc = bson.deserialize(buffer);
  //   // Validate the correctness
  //   expect('object').to.equal(typeof deserializedDoc.func);
  //   expect(1).to.equal(deserializedDoc.a);
  //
  //   // Deserialize the object with eval for the functions caching the functions
  //   deserializedDoc = bson.deserialize(buffer, {evalFunctions:true, cacheFunctions:true});
  //   // Validate the correctness
  //   expect('function').to.equal(typeof deserializedDoc.func);
  //   expect(1).to.equal(deserializedDoc.a);
  //   done();
  // }

  // /**
  //  * A simple example showing the usage of BSON.deserializeStream function returning deserialized Javascript objects.
  //  *
  //  * @_class bson
  //  * @_function BSON.deserializeStream
  //  * @ignore
  //  */
  // it('Should correctly deserializeStream a buffer object', function(done) {
  //   // Create a simple object
  //   var doc = {a: 1, func:function(){ console.log('hello world'); }}
  //   var bson = createBSON();
  //   // Serialize the object to a buffer, checking keys and serializing functions
  //   var buffer = bson.serialize(doc, {
  //     checkKeys: true,
  //     serializeFunctions: true
  //   });
  //   // Validate the correctness
  //   expect(65).to.equal(buffer.length);
  //
  //   // The array holding the number of retuned documents
  //   var documents = new Array(1);
  //   // Deserialize the object with no eval for the functions
  //   var index = bson.deserializeStream(buffer, 0, 1, documents, 0);
  //   // Validate the correctness
  //   expect(65).to.equal(index);
  //   expect(1).to.equal(documents.length);
  //   expect(1).to.equal(documents[0].a);
  //   expect('object').to.equal(typeof documents[0].func);
  //
  //   // Deserialize the object with eval for the functions caching the functions
  //   // The array holding the number of retuned documents
  //   var documents = new Array(1);
  //   // Deserialize the object with no eval for the functions
  //   var index = bson.deserializeStream(buffer, 0, 1, documents, 0, {evalFunctions:true, cacheFunctions:true});
  //   // Validate the correctness
  //   expect(65).to.equal(index);
  //   expect(1).to.equal(documents.length);
  //   expect(1).to.equal(documents[0].a);
  //   expect('function').to.equal(typeof documents[0].func);
  //   done();
  // }

  // /**
  //  * A simple example showing the usage of BSON instance deserializeStream function returning deserialized Javascript objects.
  //  *
  //  * @_class bson
  //  * @_function deserializeStream
  //  * @ignore
  //  */
  // it('Should correctly deserializeStream a buffer object', function(done) {
  //   // Create a simple object
  //   var doc = {a: 1, func:function(){ console.log('hello world'); }}
  //   // Create a BSON parser instance
  //   var bson = createBSON();
  //   // Serialize the object to a buffer, checking keys and serializing functions
  //   var buffer = bson.serialize(doc, true, true, true);
  //   // Validate the correctness
  //   expect(65).to.equal(buffer.length);
  //
  //   // The array holding the number of retuned documents
  //   var documents = new Array(1);
  //   // Deserialize the object with no eval for the functions
  //   var index = bson.deserializeStream(buffer, 0, 1, documents, 0);
  //   // Validate the correctness
  //   expect(65).to.equal(index);
  //   expect(1).to.equal(documents.length);
  //   expect(1).to.equal(documents[0].a);
  //   expect('object').to.equal(typeof documents[0].func);
  //
  //   // Deserialize the object with eval for the functions caching the functions
  //   // The array holding the number of retuned documents
  //   var documents = new Array(1);
  //   // Deserialize the object with no eval for the functions
  //   var index = bson.deserializeStream(buffer, 0, 1, documents, 0, {evalFunctions:true, cacheFunctions:true});
  //   // Validate the correctness
  //   expect(65).to.equal(index);
  //   expect(1).to.equal(documents.length);
  //   expect(1).to.equal(documents[0].a);
  //   expect('function').to.equal(typeof documents[0].func);
  //   done();
  // }

  /**
   * @ignore
   */
  it('ObjectID should have a correct cached representation of the hexString', function(done) {
    ObjectID.cacheHexString = true;
    var a = new ObjectID();
    var __id = a.__id;
    expect(__id).to.equal(a.toHexString());

    // hexString
    a = new ObjectID(__id);
    expect(__id).to.equal(a.toHexString());

    // fromHexString
    a = ObjectID.createFromHexString(__id);
    expect(a.__id).to.equal(a.toHexString());
    expect(__id).to.equal(a.toHexString());

    // number
    var genTime = a.generationTime;
    a = new ObjectID(genTime);
    __id = a.__id;
    expect(__id).to.equal(a.toHexString());

    // generationTime
    delete a.__id;
    a.generationTime = genTime;
    expect(__id).to.equal(a.toHexString());

    // createFromTime
    a = ObjectId.createFromTime(genTime);
    __id = a.__id;
    expect(__id).to.equal(a.toHexString());
    ObjectId.cacheHexString = false;

    done();
  });

  /**
   * @ignore
   */
  it('Should fail to create ObjectID due to illegal hex code', function(done) {
    try {
      new ObjectID('zzzzzzzzzzzzzzzzzzzzzzzz');
      expect(false).to.be.ok;
    } catch (err) {
      expect(true).to.be.ok;
    }

    expect(false).to.equal(ObjectID.isValid(null));
    expect(false).to.equal(ObjectID.isValid({}));
    expect(false).to.equal(ObjectID.isValid({ length: 12 }));
    expect(false).to.equal(ObjectID.isValid([]));
    expect(false).to.equal(ObjectID.isValid(true));
    expect(true).to.equal(ObjectID.isValid(0));
    expect(false).to.equal(ObjectID.isValid('invalid'));
    expect(true).to.equal(ObjectID.isValid('zzzzzzzzzzzz'));
    expect(false).to.equal(ObjectID.isValid('zzzzzzzzzzzzzzzzzzzzzzzz'));
    expect(true).to.equal(ObjectID.isValid('000000000000000000000000'));
    expect(true).to.equal(ObjectID.isValid(new ObjectID('thisis12char')));

    var tmp = new ObjectID();
    // Cloning tmp so that instanceof fails to fake import from different version/instance of the same npm package
    var objectIdLike = {
      id: tmp.id,
      toHexString: function() {
        return tmp.toHexString();
      }
    };

    expect(true).to.equal(tmp.equals(objectIdLike));
    expect(true).to.equal(tmp.equals(new ObjectId(objectIdLike)));
    expect(true).to.equal(ObjectID.isValid(objectIdLike));

    done();
  });

  /**
   * @ignore
   */
  it('Should correctly serialize the BSONRegExp type', function(done) {
    var doc = { regexp: new BSONRegExp('test', 'i') };
    var doc1 = { regexp: /test/i };
    var serialized_data = createBSON().serialize(doc);
    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    doc1 = createBSON().deserialize(serialized_data);
    var regexp = new RegExp('test', 'i');
    expect(regexp).to.deep.equal(doc1.regexp);
    done();
  });

  /**
   * @ignore
   */
  it('Should correctly deserialize the BSONRegExp type', function(done) {
    var doc = { regexp: new BSONRegExp('test', 'i') };
    var serialized_data = createBSON().serialize(doc);

    var serialized_data2 = new Buffer(createBSON().calculateObjectSize(doc));
    createBSON().serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc1 = createBSON().deserialize(serialized_data, { bsonRegExp: true });
    expect(doc1.regexp instanceof BSONRegExp).to.be.ok;
    expect('test').to.equal(doc1.regexp.pattern);
    expect('i').to.equal(doc1.regexp.options);
    done();
  });

  /**
   * @ignore
   */
  it('Should return boolean for ObjectID equality check', function(done) {
    var id = new ObjectID();
    expect(true).to.equal(id.equals(new ObjectID(id.toString())));
    expect(true).to.equal(id.equals(id.toString()));
    expect(false).to.equal(id.equals('1234567890abcdef12345678'));
    expect(false).to.equal(id.equals('zzzzzzzzzzzzzzzzzzzzzzzz'));
    expect(false).to.equal(id.equals('foo'));
    expect(false).to.equal(id.equals(null));
    expect(false).to.equal(id.equals(undefined));
    done();
  });
});
