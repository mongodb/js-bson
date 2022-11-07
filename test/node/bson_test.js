'use strict';

const { Buffer } = require('buffer');
const BSON = require('../register-bson');
const Code = BSON.Code;
const BSONRegExp = BSON.BSONRegExp;
const Binary = BSON.Binary;
const Timestamp = BSON.Timestamp;
const Long = BSON.Long;
const ObjectId = BSON.ObjectId;
const UUID = BSON.UUID;
const BSONSymbol = BSON.BSONSymbol;
const DBRef = BSON.DBRef;
const Decimal128 = BSON.Decimal128;
const Int32 = BSON.Int32;
const Double = BSON.Double;
const MinKey = BSON.MinKey;
const MaxKey = BSON.MaxKey;
const BSONError = BSON.BSONError;
const { BinaryParser } = require('./tools/binary_parser');
const vm = require('vm');
const { assertBuffersEqual, isBufferOrUint8Array } = require('./tools/utils');
const { inspect } = require('util');

/**
 * Module for parsing an ISO 8601 formatted string into a Date object.
 */
const ISO_REGEX =
  /^(\d{4})(-(\d{2})(-(\d{2})(T(\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|((\+|-)(\d{2}):(\d{2}))))?)?)?$/;
var ISODate = function (string) {
  if (typeof string.getTime === 'function') {
    return string;
  }

  const match = string.match(ISO_REGEX);
  if (!match) {
    throw new BSONError(`Invalid ISO 8601 date given: ${string}`);
  }

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
};

describe('BSON', function () {
  /**
   * @ignore
   */
  it('Should Correctly convert ObjectId to itself', function (done) {
    var myObject, newObject;
    var selfConversion = function () {
      myObject = new ObjectId();
      newObject = ObjectId(myObject);
    };

    expect(selfConversion).to.not.throw;
    expect(myObject).to.equal(newObject);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly get BSON types from require', function (done) {
    var _mongodb = require('../register-bson');
    expect(_mongodb.ObjectId === ObjectId).to.be.ok;
    expect(_mongodb.UUID === UUID).to.be.ok;
    expect(_mongodb.Binary === Binary).to.be.ok;
    expect(_mongodb.Long === Long).to.be.ok;
    expect(_mongodb.Timestamp === Timestamp).to.be.ok;
    expect(_mongodb.Code === Code).to.be.ok;
    expect(_mongodb.DBRef === DBRef).to.be.ok;
    expect(_mongodb.BSONSymbol === BSONSymbol).to.be.ok;
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
  it('Should Correctly Deserialize object', function (done) {
    // prettier-ignore
    var bytes = [95, 0, 0, 0, 2, 110, 115, 0, 42, 0, 0, 0, 105, 110, 116, 101, 103, 114, 97, 116, 105, 111, 110, 95, 116, 101, 115, 116, 115, 95, 46, 116, 101, 115, 116, 95, 105, 110, 100, 101, 120, 95, 105, 110, 102, 111, 114, 109, 97, 116, 105, 111, 110, 0, 8, 117, 110, 105, 113, 117, 101, 0, 0, 3, 107, 101, 121, 0, 12, 0, 0, 0, 16, 97, 0, 1, 0, 0, 0, 0, 2, 110, 97, 109, 101, 0, 4, 0, 0, 0, 97, 95, 49, 0, 0];
    let serialized_data = '';
    // Convert to chars
    for (let i = 0; i < bytes.length; i++) {
      serialized_data = serialized_data + BinaryParser.fromByte(bytes[i]);
    }

    var object = BSON.deserialize(Buffer.from(serialized_data, 'binary'));
    expect('a_1').to.equal(object.name);
    expect(false).to.equal(object.unique);
    expect(1).to.equal(object.key.a);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Deserialize object with all types', function (done) {
    var bytes = [
      26, 1, 0, 0, 7, 95, 105, 100, 0, 161, 190, 98, 75, 118, 169, 3, 0, 0, 3, 0, 0, 4, 97, 114,
      114, 97, 121, 0, 26, 0, 0, 0, 16, 48, 0, 1, 0, 0, 0, 16, 49, 0, 2, 0, 0, 0, 16, 50, 0, 3, 0,
      0, 0, 0, 2, 115, 116, 114, 105, 110, 103, 0, 6, 0, 0, 0, 104, 101, 108, 108, 111, 0, 3, 104,
      97, 115, 104, 0, 19, 0, 0, 0, 16, 97, 0, 1, 0, 0, 0, 16, 98, 0, 2, 0, 0, 0, 0, 9, 100, 97,
      116, 101, 0, 161, 190, 98, 75, 0, 0, 0, 0, 7, 111, 105, 100, 0, 161, 190, 98, 75, 90, 217, 18,
      0, 0, 1, 0, 0, 5, 98, 105, 110, 97, 114, 121, 0, 7, 0, 0, 0, 2, 3, 0, 0, 0, 49, 50, 51, 16,
      105, 110, 116, 0, 42, 0, 0, 0, 1, 102, 108, 111, 97, 116, 0, 223, 224, 11, 147, 169, 170, 64,
      64, 11, 114, 101, 103, 101, 120, 112, 0, 102, 111, 111, 98, 97, 114, 0, 105, 0, 8, 98, 111,
      111, 108, 101, 97, 110, 0, 1, 15, 119, 104, 101, 114, 101, 0, 25, 0, 0, 0, 12, 0, 0, 0, 116,
      104, 105, 115, 46, 120, 32, 61, 61, 32, 51, 0, 5, 0, 0, 0, 0, 3, 100, 98, 114, 101, 102, 0,
      37, 0, 0, 0, 2, 36, 114, 101, 102, 0, 5, 0, 0, 0, 116, 101, 115, 116, 0, 7, 36, 105, 100, 0,
      161, 190, 98, 75, 2, 180, 1, 0, 0, 2, 0, 0, 0, 10, 110, 117, 108, 108, 0, 0
    ];
    let serialized_data = '';

    // Convert to chars
    for (let i = 0; i < bytes.length; i++) {
      serialized_data = serialized_data + BinaryParser.fromByte(bytes[i]);
    }

    const object = BSON.deserialize(Buffer.from(serialized_data, 'binary'));
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
  it('Should Serialize and Deserialize String', function (done) {
    var test_string = { hello: 'world' };
    var serialized_data = BSON.serialize(test_string, {
      checkKeys: false
    });

    BSON.serializeWithBufferAndIndex(test_string, serialized_data, {
      checkKeys: false,
      index: 0
    });

    expect(test_string).to.deep.equal(BSON.deserialize(serialized_data));
    done();
  });

  /**
   * @ignore
   */
  it('Should Serialize and Deserialize Empty String', function (done) {
    var test_string = { hello: '' };
    var serialized_data = BSON.serialize(test_string);
    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(test_string));
    BSON.serializeWithBufferAndIndex(test_string, serialized_data2);

    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(test_string).to.deep.equal(BSON.deserialize(serialized_data));
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Integer 5', function (done) {
    var test_number = { doc: 5 };

    var serialized_data = BSON.serialize(test_number);
    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(test_number));
    BSON.serializeWithBufferAndIndex(test_number, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(test_number).to.deep.equal(BSON.deserialize(serialized_data));
    expect(test_number).to.deep.equal(BSON.deserialize(serialized_data2));
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize null value', function (done) {
    var test_null = { doc: null };
    var serialized_data = BSON.serialize(test_null);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(test_null));
    BSON.serializeWithBufferAndIndex(test_null, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var object = BSON.deserialize(serialized_data);
    expect(null).to.equal(object.doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Number 1', function (done) {
    var test_number = { doc: 5.5 };
    var serialized_data = BSON.serialize(test_number);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(test_number));
    BSON.serializeWithBufferAndIndex(test_number, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    expect(test_number).to.deep.equal(BSON.deserialize(serialized_data));
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Integer', function (done) {
    var test_int = { doc: 42 };
    var serialized_data = BSON.serialize(test_int);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(test_int));
    BSON.serializeWithBufferAndIndex(test_int, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(test_int.doc).to.deep.equal(BSON.deserialize(serialized_data).doc);

    test_int = { doc: -5600 };
    serialized_data = BSON.serialize(test_int);

    serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(test_int));
    BSON.serializeWithBufferAndIndex(test_int, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(test_int.doc).to.deep.equal(BSON.deserialize(serialized_data).doc);

    test_int = { doc: 2147483647 };
    serialized_data = BSON.serialize(test_int);

    serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(test_int));
    BSON.serializeWithBufferAndIndex(test_int, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(test_int.doc).to.deep.equal(BSON.deserialize(serialized_data).doc);

    test_int = { doc: -2147483648 };
    serialized_data = BSON.serialize(test_int);

    serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(test_int));
    BSON.serializeWithBufferAndIndex(test_int, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(test_int.doc).to.deep.equal(BSON.deserialize(serialized_data).doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Object', function (done) {
    var doc = { doc: { age: 42, name: 'Spongebob', shoe_size: 9.5 } };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    expect(doc.doc.age).to.deep.equal(BSON.deserialize(serialized_data).doc.age);
    expect(doc.doc.name).to.deep.equal(BSON.deserialize(serialized_data).doc.name);
    expect(doc.doc.shoe_size).to.deep.equal(BSON.deserialize(serialized_data).doc.shoe_size);

    done();
  });

  /**
   * @ignore
   */
  it('Should correctly ignore undefined values in arrays', function (done) {
    var doc = { doc: { notdefined: undefined } };
    var serialized_data = BSON.serialize(doc, {
      ignoreUndefined: true
    });
    var serialized_data2 = Buffer.alloc(
      BSON.calculateObjectSize(doc, {
        ignoreUndefined: true
      })
    );
    BSON.serializeWithBufferAndIndex(doc, serialized_data2, {
      ignoreUndefined: true
    });

    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc1 = BSON.deserialize(serialized_data);

    expect(undefined).to.deep.equal(doc1.doc.notdefined);
    done();
  });

  it('Should correctly serialize undefined array entries as null values', function (done) {
    var doc = { doc: { notdefined: undefined }, a: [1, 2, undefined, 3] };
    var serialized_data = BSON.serialize(doc, {
      ignoreUndefined: true
    });
    var serialized_data2 = Buffer.alloc(
      BSON.calculateObjectSize(doc, {
        ignoreUndefined: true
      })
    );
    BSON.serializeWithBufferAndIndex(doc, serialized_data2, {
      ignoreUndefined: true
    });
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc1 = BSON.deserialize(serialized_data);
    expect(undefined).to.deep.equal(doc1.doc.notdefined);
    expect(null).to.equal(doc1.a[2]);
    done();
  });

  it('Should correctly serialize undefined array entries as undefined values', function (done) {
    var doc = { doc: { notdefined: undefined }, a: [1, 2, undefined, 3] };
    var serialized_data = BSON.serialize(doc, {
      ignoreUndefined: false
    });
    var serialized_data2 = Buffer.alloc(
      BSON.calculateObjectSize(doc, {
        ignoreUndefined: false
      })
    );
    BSON.serializeWithBufferAndIndex(doc, serialized_data2, {
      ignoreUndefined: false
    });

    // console.log("======================================== 0")
    // console.log(serialized_data.toString('hex'))
    // console.log(serialized_data2.toString('hex'))

    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc1 = BSON.deserialize(serialized_data);
    var doc2 = BSON.deserialize(serialized_data2);
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
  it('Should Correctly Serialize and Deserialize Array', function (done) {
    var doc = { doc: [1, 2, 'a', 'b'] };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized = BSON.deserialize(serialized_data);
    expect(doc.doc[0]).to.equal(deserialized.doc[0]);
    expect(doc.doc[1]).to.equal(deserialized.doc[1]);
    expect(doc.doc[2]).to.equal(deserialized.doc[2]);
    expect(doc.doc[3]).to.equal(deserialized.doc[3]);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Buffer', function (done) {
    var doc = { doc: Buffer.from('hello world') };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized = BSON.deserialize(serialized_data);
    expect(deserialized.doc instanceof Binary).to.be.ok;
    expect(deserialized.doc.toString()).to.equal('hello world');
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Buffer with promoteBuffers option', function (done) {
    var doc = { doc: Buffer.from('hello world') };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized = BSON.deserialize(serialized_data, {
      promoteBuffers: true
    });
    expect(
      isBufferOrUint8Array(deserialized.doc),
      `expected deserialized.doc to be instanceof buffer or uint8Array`
    ).to.be.true;
    expect(deserialized.doc).to.not.be.instanceOf(Binary);
    expect(doc.doc).to.deep.equal(deserialized.doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Number 4', function (done) {
    var doc = { doc: BSON.BSON_INT32_MAX + 10 };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized = BSON.deserialize(serialized_data);
    // expect(deserialized.doc instanceof Binary).to.be.ok;
    expect(BSON.BSON_INT32_MAX + 10).to.equal(deserialized.doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Array with added on functions', function (done) {
    Array.prototype.toXml = function () {};
    var doc = { doc: [1, 2, 'a', 'b'] };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized = BSON.deserialize(serialized_data);
    expect(doc.doc[0]).to.equal(deserialized.doc[0]);
    expect(doc.doc[1]).to.equal(deserialized.doc[1]);
    expect(doc.doc[2]).to.equal(deserialized.doc[2]);
    expect(doc.doc[3]).to.equal(deserialized.doc[3]);
    done();
  });

  /**
   * @ignore
   */
  it('Should correctly deserialize a nested object', function (done) {
    var doc = { doc: { doc: 1 } };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    expect(doc.doc.doc).to.deep.equal(BSON.deserialize(serialized_data).doc.doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize A Boolean', function (done) {
    var doc = { doc: true };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    expect(doc.doc).to.equal(BSON.deserialize(serialized_data).doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize a Date', function (done) {
    var date = new Date();
    //(2009, 11, 12, 12, 00, 30)
    date.setUTCDate(12);
    date.setUTCFullYear(2009);
    date.setUTCMonth(11 - 1);
    date.setUTCHours(12);
    date.setUTCMinutes(0);
    date.setUTCSeconds(30);
    var doc = { doc: date };
    var serialized_data = BSON.serialize(doc);
    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);

    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc1 = BSON.deserialize(serialized_data);
    expect(doc).to.deep.equal(doc1);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize a Date from another VM', function (done) {
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
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    expect(doc.date).to.equal(BSON.deserialize(serialized_data).doc.date);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize nested doc', function (done) {
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

    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Oid', function (done) {
    var doc = { doc: new ObjectId() };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    const deserializedDoc = BSON.deserialize(serialized_data);
    expect(deserializedDoc.doc).instanceof(ObjectId);
    expect(doc.doc.toString('hex')).to.equal(deserializedDoc.doc.toString('hex'));
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly encode Empty Hash', function (done) {
    var doc = {};
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    expect(doc).to.deep.equal(BSON.deserialize(serialized_data));
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Ordered Hash', function (done) {
    var doc = { doc: { b: 1, a: 2, c: 3, d: 4 } };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var decoded_hash = BSON.deserialize(serialized_data).doc;
    var keys = [];

    for (var name in decoded_hash) keys.push(name);
    expect(['b', 'a', 'c', 'd']).to.deep.equal(keys);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Regular Expression', function (done) {
    // Serialize the regular expression
    var doc = { doc: /foobar/im };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = BSON.deserialize(serialized_data);

    expect(doc.doc.toString()).to.deep.equal(doc2.doc.toString());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize a Binary object', function (done) {
    var bin = new Binary();
    var string = 'binstring';
    for (var index = 0; index < string.length; index++) {
      bin.put(string.charAt(index));
    }

    var doc = { doc: bin };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);

    expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize a Type 2 Binary object', function (done) {
    var bin = new Binary(Buffer.from('binstring'), Binary.SUBTYPE_BYTE_ARRAY);
    var string = 'binstring';
    for (var index = 0; index < string.length; index++) {
      bin.put(string.charAt(index));
    }

    var doc = { doc: bin };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);

    expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize DBRef', function (done) {
    var oid = new ObjectId();
    var doc = { dbref: new DBRef('namespace', oid, undefined, {}) };
    var b = BSON;

    var serialized_data = b.serialize(doc);
    var serialized_data2 = Buffer.alloc(b.calculateObjectSize(doc));
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
  it('Should Correctly Serialize and Deserialize partial DBRef', function (done) {
    var id = new ObjectId();
    var doc = { name: 'something', user: { $ref: 'username', $id: id } };
    var b = BSON;
    var serialized_data = b.serialize(doc);

    var serialized_data2 = Buffer.alloc(b.calculateObjectSize(doc));
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
  it('Should Correctly Serialize and Deserialize simple Int', function (done) {
    var doc = { doc: 2147483648 };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = BSON.deserialize(serialized_data);
    expect(doc.doc).to.deep.equal(doc2.doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Long Integer', function (done) {
    var doc = { doc: Long.fromNumber(9223372036854776000) };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);
    expect(doc.doc.equals(deserialized_data.doc)).to.be.true;

    doc = { doc: Long.fromNumber(-9223372036854776) };
    serialized_data = BSON.serialize(doc);
    deserialized_data = BSON.deserialize(serialized_data);
    expect(doc.doc.equals(deserialized_data.doc)).to.be.true;

    doc = { doc: Long.fromNumber(-9223372036854776000) };
    serialized_data = BSON.serialize(doc);
    deserialized_data = BSON.deserialize(serialized_data);
    expect(doc.doc.equals(deserialized_data.doc)).to.be.true;
    done();
  });

  /**
   * @ignore
   */
  it('Should Deserialize Large Integers as Number not Long', function (done) {
    function roundTrip(val) {
      var doc = { doc: val };
      var serialized_data = BSON.serialize(doc);

      var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
      BSON.serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = BSON.deserialize(serialized_data);
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
    roundTrip(9223372036854776000);
    roundTrip(1234567890123456800); // Bigger than 2^53, stays a double.
    roundTrip(-1234567890123456800);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Timestamp as subclass of Long', function (done) {
    var long = Long.fromNumber(9223372036854776000);
    var timestamp = Timestamp.fromNumber(9223372036854776000);
    expect(long instanceof Long).to.be.ok;
    expect(!(long instanceof Timestamp)).to.be.ok;
    expect(timestamp instanceof Timestamp).to.be.ok;
    expect(timestamp instanceof Long).to.be.ok;

    var test_int = { doc: long, doc2: timestamp };
    var serialized_data = BSON.serialize(test_int);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(test_int));
    BSON.serializeWithBufferAndIndex(test_int, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);
    expect(test_int.doc.equals(deserialized_data.doc)).to.be.true;
    done();
  });

  /**
   * @ignore
   */
  it('Should Always put the id as the first item in a hash', function (done) {
    var hash = { doc: { not_id: 1, _id: 2 } };
    var serialized_data = BSON.serialize(hash);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(hash));
    BSON.serializeWithBufferAndIndex(hash, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);
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
  it('Should Correctly Serialize and Deserialize a User defined Binary object', function (done) {
    var bin = new Binary();
    bin.sub_type = BSON.BSON_BINARY_SUBTYPE_USER_DEFINED;
    var string = 'binstring';
    for (var index = 0; index < string.length; index++) {
      bin.put(string.charAt(index));
    }

    var doc = { doc: bin };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var deserialized_data = BSON.deserialize(serialized_data);

    expect(deserialized_data.doc.sub_type).to.deep.equal(BSON.BSON_BINARY_SUBTYPE_USER_DEFINED);
    expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize a Code object', function (done) {
    var doc = { doc: { doc2: new Code('this.a > i', { i: 1 }) } };
    var serialized_data = BSON.serialize(doc);
    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);
    expect(doc.doc.doc2.code).to.deep.equal(deserialized_data.doc.doc2.code);
    expect(doc.doc.doc2.scope.i).to.deep.equal(deserialized_data.doc.doc2.scope.i);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly serialize and deserialize and embedded array', function (done) {
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

    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);
    expect(doc.a).to.deep.equal(deserialized_data.a);
    expect(doc.b).to.deep.equal(deserialized_data.b);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize UTF8', function (done) {
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
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);
    expect(doc).to.deep.equal(deserialized_data);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize query object', function (done) {
    var doc = { count: 'remove_with_no_callback_bug_test', query: {}, fields: null };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);
    expect(doc).to.deep.equal(deserialized_data);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize empty query object', function (done) {
    var doc = {};
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);
    expect(doc).to.deep.equal(deserialized_data);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize array based doc', function (done) {
    var doc = { b: [1, 2, 3], _id: new ObjectId() };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);
    expect(doc.b).to.deep.equal(deserialized_data.b);
    expect(doc).to.deep.equal(deserialized_data);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize and Deserialize Symbol', function (done) {
    if (BSONSymbol != null) {
      // symbols are deprecated, so upgrade to strings... so I'm not sure
      // we really need this test anymore...
      //var doc = { b: [new BSONSymbol('test')] };

      var doc = { b: ['test'] };
      var serialized_data = BSON.serialize(doc);
      var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
      BSON.serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = BSON.deserialize(serialized_data);
      expect(doc).to.deep.equal(deserialized_data);
      expect(typeof deserialized_data.b[0]).to.equal('string');
    }

    done();
  });

  /**
   * @ignore
   */
  it('Should handle Deeply nested document', function (done) {
    var doc = { a: { b: { c: { d: 2 } } } };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = BSON.deserialize(serialized_data);
    expect(doc).to.deep.equal(deserialized_data);
    done();
  });

  /**
   * @ignore
   */
  it('Should handle complicated all typed object', function (done) {
    // First doc
    var date = new Date();
    var oid = new ObjectId();
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
    oid = ObjectId.createFromHexString(oid.toHexString());
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

    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);

    expect(serialized_data).to.deep.equal(serialized_data2);

    serialized_data2 = BSON.serialize(doc2, false, true);

    expect(serialized_data).to.deep.equal(serialized_data2);

    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize Complex Nested Object', function (done) {
    var doc = {
      email: 'email@email.com',
      encrypted_password: 'password',
      friends: ['4db96b973d01205364000006', '4dc77b24c5ba38be14000002'],
      location: [72.4930088, 23.0431957],
      name: 'Amit Kumar',
      password_salt: 'salty',
      profile_fields: [],
      username: 'amit',
      _id: new ObjectId()
    };

    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = doc;
    doc2._id = ObjectId.createFromHexString(doc2._id.toHexString());
    serialized_data2 = BSON.serialize(doc2, false, true);

    for (var i = 0; i < serialized_data2.length; i++) {
      expect(serialized_data2[i]).to.equal(serialized_data[i]);
    }

    done();
  });

  /**
   * @ignore
   */
  it('Should correctly massive doc', function (done) {
    var oid1 = new ObjectId();
    var oid2 = new ObjectId();

    var b = BSON;

    // JS doc
    var doc = {
      dbref2: new DBRef('namespace', oid1, 'integration_tests_'),
      _id: oid2
    };

    var doc2 = {
      dbref2: new DBRef(
        'namespace',
        ObjectId.createFromHexString(oid1.toHexString()),
        'integration_tests_'
      ),
      _id: ObjectId.createFromHexString(oid2.toHexString())
    };

    var serialized_data = b.serialize(doc);
    var serialized_data2 = Buffer.alloc(b.calculateObjectSize(doc));
    b.serializeWithBufferAndIndex(doc, serialized_data2);
    expect(serialized_data).to.deep.equal(serialized_data2);

    serialized_data2 = b.serialize(doc2, false, true);
    expect(serialized_data).to.deep.equal(serialized_data2);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize/Deserialize regexp object', function (done) {
    var doc = { b: /foobaré/ };

    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    serialized_data2 = BSON.serialize(doc);

    for (var i = 0; i < serialized_data2.length; i++) {
      expect(serialized_data2[i]).to.equal(serialized_data[i]);
    }

    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize/Deserialize complicated object', function (done) {
    var doc = { a: { b: { c: [new ObjectId(), new ObjectId()] } }, d: { f: 1332.3323 } };

    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = BSON.deserialize(serialized_data);

    expect(doc).to.deep.equal(doc2);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize/Deserialize nested object', function (done) {
    var doc = {
      _id: { date: new Date(), gid: '6f35f74d2bea814e21000000' },
      value: {
        b: { countries: { '--': 386 }, total: 1599 },
        bc: { countries: { '--': 3 }, total: 10 },
        gp: { countries: { '--': 2 }, total: 13 },
        mgc: { countries: { '--': 2 }, total: 14 }
      }
    };

    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = BSON.deserialize(serialized_data);

    expect(doc).to.deep.equal(doc2);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize/Deserialize nested object with even more nesting', function (done) {
    var doc = {
      _id: { date: { a: 1, b: 2, c: new Date() }, gid: '6f35f74d2bea814e21000000' },
      value: {
        b: { countries: { '--': 386 }, total: 1599 },
        bc: { countries: { '--': 3 }, total: 10 },
        gp: { countries: { '--': 2 }, total: 13 },
        mgc: { countries: { '--': 2 }, total: 14 }
      }
    };

    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc2 = BSON.deserialize(serialized_data);
    expect(doc).to.deep.equal(doc2);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly Serialize empty name object', function (done) {
    var doc = {
      '': 'test',
      bbbb: 1
    };
    var serialized_data = BSON.serialize(doc);
    var doc2 = BSON.deserialize(serialized_data);
    expect(doc2['']).to.equal('test');
    expect(doc2['bbbb']).to.equal(1);
    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly handle Forced Doubles to ensure we allocate enough space for cap collections', function (done) {
    if (Double != null) {
      var doubleValue = new Double(100);
      var doc = { value: doubleValue };

      // Serialize
      var serialized_data = BSON.serialize(doc);

      var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
      BSON.serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var doc2 = BSON.deserialize(serialized_data);
      expect({ value: 100 }).to.deep.equal(doc2);
    }

    done();
  });

  /**
   * @ignore
   */
  it('Should deserialize correctly', function (done) {
    var doc = {
      _id: new ObjectId('4e886e687ff7ef5e00000162'),
      str: 'foreign',
      type: 2,
      timestamp: ISODate('2011-10-02T14:00:08.383Z'),
      links: [
        'http://www.reddit.com/r/worldnews/comments/kybm0/uk_home_secretary_calls_for_the_scrapping_of_the/'
      ]
    };

    var serialized_data = BSON.serialize(doc);
    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc2 = BSON.deserialize(serialized_data);

    expect(JSON.stringify(doc)).to.deep.equal(JSON.stringify(doc2));
    done();
  });

  /**
   * @ignore
   */
  it('Should correctly serialize and deserialize MinKey and MaxKey values', function (done) {
    var doc = {
      _id: new ObjectId('4e886e687ff7ef5e00000162'),
      minKey: new MinKey(),
      maxKey: new MaxKey()
    };

    var serialized_data = BSON.serialize(doc);
    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc2 = BSON.deserialize(serialized_data);

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
  it('Should correctly serialize Double value', function (done) {
    var doc = {
      value: new Double(34343.2222)
    };

    var serialized_data = BSON.serialize(doc);
    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc2 = BSON.deserialize(serialized_data);

    expect(doc.value.valueOf(), doc2.value).to.be.ok;
    expect(doc.value.value, doc2.value).to.be.ok;
    done();
  });

  /**
   * @ignore
   */
  it('ObjectId should correctly create objects', function (done) {
    try {
      ObjectId.createFromHexString('000000000000000000000001');
      ObjectId.createFromHexString('00000000000000000000001');
      expect(false).to.be.ok;
    } catch (err) {
      expect(err != null).to.be.ok;
    }

    done();
  });

  /**
   * @ignore
   */
  it('ObjectId should correctly retrieve timestamp', function (done) {
    var testDate = new Date();
    var object1 = new ObjectId();
    expect(Math.floor(testDate.getTime() / 1000)).to.equal(
      Math.floor(object1.getTimestamp().getTime() / 1000)
    );

    done();
  });

  /**
   * @ignore
   */
  it('Should Correctly throw error on bsonparser errors', function (done) {
    var data = Buffer.alloc(3);
    var parser = BSON;

    expect(() => {
      parser.deserialize(data);
    }).to.throw();

    data = Buffer.alloc(5);
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
  it('Should correctly calculate the size of a given javascript object', function (done) {
    // Create a simple object
    var doc = { a: 1, func: function () {} };
    var bson = BSON;
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
  it('Should correctly calculate the size of a given javascript object using instance method', function (done) {
    // Create a simple object
    var doc = { a: 1, func: function () {} };
    // Create a BSON parser instance
    var bson = BSON;
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
  it('Should correctly serializeWithBufferAndIndex a given javascript object', function (done) {
    // Create a simple object
    var doc = { a: 1, func: function () {} };
    var bson = BSON;

    // Calculate the size of the document, no function serialization
    var size = bson.calculateObjectSize(doc, { serializeFunctions: false });
    var buffer = Buffer.alloc(size);
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
    buffer = Buffer.alloc(size);
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
  it('Should correctly serializeWithBufferAndIndex a given javascript object using a BSON instance', function (done) {
    // Create a simple object
    var doc = { a: 1, func: function () {} };
    // Create a BSON parser instance
    var bson = BSON;
    // Calculate the size of the document, no function serialization
    var size = bson.calculateObjectSize(doc, {
      serializeFunctions: false
    });
    // Allocate a buffer
    var buffer = Buffer.alloc(size);
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
    buffer = Buffer.alloc(size);
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
  it('Should correctly serialize a given javascript object', function (done) {
    // Create a simple object
    var doc = { a: 1, func: function () {} };
    // Create a BSON parser instance
    var bson = BSON;

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
  it('Should correctly serialize a given javascript object using a bson instance', function (done) {
    // Create a simple object
    var doc = { a: 1, func: function () {} };
    // Create a BSON parser instance
    var bson = BSON;

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

  it('should properly deserialize multiple documents using deserializeStream', function () {
    const bson = BSON;
    const docs = [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'quux' }];

    // Serialize the test data
    const serializedDocs = [];
    for (let i = 0; i < docs.length; i++) {
      serializedDocs[i] = bson.serialize(docs[i]);
    }
    const buf = Buffer.concat(serializedDocs);

    const parsedDocs = [];
    bson.deserializeStream(buf, 0, docs.length, parsedDocs, 0);

    docs.forEach((doc, i) => expect(doc).to.deep.equal(parsedDocs[i]));
  });

  /**
   * @ignore
   */
  it('ObjectId should have a correct cached representation of the hexString', function (done) {
    ObjectId.cacheHexString = true;
    var a = new ObjectId();
    var __id = a.__id;
    expect(__id).to.equal(a.toHexString());

    // hexString
    a = new ObjectId(__id);
    expect(__id).to.equal(a.toHexString());

    // fromHexString
    a = ObjectId.createFromHexString(__id);
    expect(a.__id).to.equal(a.toHexString());
    expect(__id).to.equal(a.toHexString());

    // number
    var genTime = a.generationTime;
    a = new ObjectId(genTime);
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
  it('Should fail to create ObjectId due to illegal hex code', function (done) {
    try {
      new ObjectId('zzzzzzzzzzzzzzzzzzzzzzzz');
      expect(false).to.be.ok;
    } catch (err) {
      expect(true).to.be.ok;
    }

    expect(false).to.equal(ObjectId.isValid(null));
    expect(false).to.equal(ObjectId.isValid({}));
    expect(false).to.equal(ObjectId.isValid({ length: 12 }));
    expect(false).to.equal(ObjectId.isValid([]));
    expect(false).to.equal(ObjectId.isValid(true));
    expect(true).to.equal(ObjectId.isValid(0));
    expect(false).to.equal(ObjectId.isValid('invalid'));
    expect(true).to.equal(ObjectId.isValid('zzzzzzzzzzzz'));
    expect(false).to.equal(ObjectId.isValid('zzzzzzzzzzzzzzzzzzzzzzzz'));
    expect(true).to.equal(ObjectId.isValid('000000000000000000000000'));
    expect(true).to.equal(ObjectId.isValid(new ObjectId('thisis12char')));

    var tmp = new ObjectId();
    // Cloning tmp so that instanceof fails to fake import from different version/instance of the same npm package
    var objectIdLike = {
      id: tmp.id,
      toHexString: function () {
        return tmp.toHexString();
      }
    };

    expect(true).to.equal(tmp.equals(objectIdLike));
    expect(true).to.equal(tmp.equals(new ObjectId(objectIdLike)));
    expect(true).to.equal(ObjectId.isValid(objectIdLike));

    done();
  });

  /**
   * @ignore
   */
  it('Should correctly serialize the BSONRegExp type', function (done) {
    var doc = { regexp: new BSONRegExp('test', 'i') };
    var doc1 = { regexp: /test/i };
    var serialized_data = BSON.serialize(doc);
    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    doc1 = BSON.deserialize(serialized_data);
    var regexp = new RegExp('test', 'i');
    expect(regexp).to.deep.equal(doc1.regexp);
    done();
  });

  /**
   * @ignore
   */
  it('Should correctly deserialize the BSONRegExp type', function (done) {
    var doc = { regexp: new BSONRegExp('test', 'i') };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc1 = BSON.deserialize(serialized_data, { bsonRegExp: true });
    expect(doc1.regexp instanceof BSONRegExp).to.be.ok;
    expect('test').to.equal(doc1.regexp.pattern);
    expect('i').to.equal(doc1.regexp.options);
    done();
  });

  describe('BSONRegExp', () => {
    it('Should alphabetize options', () => {
      const b = new BSONRegExp('cba', 'mix');
      expect(b.options).to.equal('imx');
    });

    it('should correctly serialize JavaScript Regex with control character', () => {
      const regex = /a\x34b/m;
      const aNewLineB = BSON.serialize({ regex });
      const { regex: roundTripRegex } = BSON.deserialize(aNewLineB);
      expect(regex.source).to.equal(roundTripRegex.source);
      expect(regex.flags).to.equal(roundTripRegex.flags);
    });
  });

  /**
   * @ignore
   */
  it('Should correctly deserialize objects containing __proto__ keys', function (done) {
    var doc = { ['__proto__']: { a: 42 } };
    var serialized_data = BSON.serialize(doc);

    var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var doc1 = BSON.deserialize(serialized_data);
    expect(doc1).to.have.deep.ownPropertyDescriptor('__proto__', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: { a: 42 }
    });
    expect(doc1.__proto__.a).to.equal(42);
    done();
  });

  /**
   * @ignore
   */
  it('Should return boolean for ObjectId equality check', function (done) {
    var id = new ObjectId();
    expect(true).to.equal(id.equals(new ObjectId(id.toString())));
    expect(true).to.equal(id.equals(id.toString()));
    expect(false).to.equal(id.equals('1234567890abcdef12345678'));
    expect(false).to.equal(id.equals('zzzzzzzzzzzzzzzzzzzzzzzz'));
    expect(false).to.equal(id.equals('foo'));
    expect(false).to.equal(id.equals(null));
    expect(false).to.equal(id.equals(undefined));
    done();
  });

  it('should serialize ObjectIds from old bson versions', function () {
    // In versions 4.0.0 and 4.0.1, we used _bsontype="ObjectId" which broke
    // backwards compatibility with mongodb-core and other code. It was reverted
    // back to "ObjectID" (capital D) in later library versions.
    // The test below ensures that all three versions of Object ID work OK:
    // 1. The current version's class
    // 2. A simulation of the class from library 4.0.0
    // 3. The class currently in use by mongodb (not tested in browser where mongodb is unavailable)

    // test the old ObjectID class (in mongodb-core 3.1) because MongoDB drivers still return it
    function getOldBSON() {
      try {
        // do a dynamic resolve to avoid exception when running browser tests
        const file = require.resolve('mongodb-core');
        const oldModule = require(file).BSON;
        const funcs = new oldModule.BSON();
        oldModule.serialize = funcs.serialize;
        oldModule.deserialize = funcs.deserialize;
        return oldModule;
      } catch (e) {
        return BSON; // if mongo is unavailable, e.g. browser tests, just re-use new BSON
      }
    }

    const OldBSON = getOldBSON();
    const OldObjectID = OldBSON === BSON ? BSON.ObjectId : OldBSON.ObjectID;

    // create a wrapper simulating the old ObjectId class from v4.0.0
    class ObjectIdv400 {
      constructor() {
        this.oid = new ObjectId();
      }
      get id() {
        return this.oid.id;
      }
      toString() {
        return this.oid.toString();
      }
    }
    Object.defineProperty(ObjectIdv400.prototype, '_bsontype', { value: 'ObjectId' });

    // Array
    const array = [new ObjectIdv400(), new OldObjectID(), new ObjectId()];
    const deserializedArrayAsMap = BSON.deserialize(BSON.serialize(array));
    const deserializedArray = Object.keys(deserializedArrayAsMap).map(
      x => deserializedArrayAsMap[x]
    );
    expect(deserializedArray.map(x => x.toString())).to.eql(array.map(x => x.toString()));

    // Map
    const map = new Map();
    map.set('oldBsonType', new ObjectIdv400());
    map.set('reallyOldBsonType', new OldObjectID());
    map.set('newBsonType', new ObjectId());
    const deserializedMapAsObject = BSON.deserialize(BSON.serialize(map), { relaxed: false });
    const deserializedMap = new Map(
      Object.keys(deserializedMapAsObject).map(k => [k, deserializedMapAsObject[k]])
    );

    map.forEach((value, key) => {
      expect(deserializedMap.has(key)).to.be.true;
      const deserializedMapValue = deserializedMap.get(key);
      expect(deserializedMapValue.toString()).to.equal(value.toString());
    });

    // Object
    const record = {
      oldBsonType: new ObjectIdv400(),
      reallyOldBsonType: new OldObjectID(),
      newBsonType: new ObjectId()
    };
    const deserializedObject = BSON.deserialize(BSON.serialize(record));
    expect(deserializedObject).to.have.keys(['oldBsonType', 'reallyOldBsonType', 'newBsonType']);
    expect(record.oldBsonType.toString()).to.equal(deserializedObject.oldBsonType.toString());
    expect(record.newBsonType.toString()).to.equal(deserializedObject.newBsonType.toString());
  });

  it('should throw if invalid BSON types are input to BSON serializer', function () {
    const oid = new ObjectId('111111111111111111111111');
    const badBsonType = Object.assign({}, oid, { _bsontype: 'bogus' });
    const badDoc = { bad: badBsonType };
    const badArray = [oid, badDoc];
    const badMap = new Map([
      ['a', badBsonType],
      ['b', badDoc],
      ['c', badArray]
    ]);

    expect(() => BSON.serialize(badDoc)).to.throw();
    expect(() => BSON.serialize(badArray)).to.throw();
    expect(() => BSON.serialize(badMap)).to.throw();
  });

  describe('Should support util.inspect for', function () {
    /**
     * @ignore
     */
    it('Binary', function () {
      const binary = new Binary(Buffer.from('0123456789abcdef0123456789abcdef', 'hex'), 4);
      expect(inspect(binary)).to.equal(
        'new Binary(Buffer.from("0123456789abcdef0123456789abcdef", "hex"), 4)'
      );
    });

    /**
     * @ignore
     */
    it('BSONSymbol', function () {
      const symbol = new BSONSymbol('sym');
      expect(inspect(symbol)).to.equal('new BSONSymbol("sym")');
    });

    /**
     * @ignore
     */
    it('Code', function () {
      const code = new Code('this.a > i', { i: 1 });
      expect(inspect(code)).to.equal('new Code("this.a > i", {"i":1})');
    });

    /**
     * @ignore
     */
    it('DBRef', function () {
      const oid = new ObjectId('deadbeefdeadbeefdeadbeef');
      const dbref = new DBRef('namespace', oid, 'integration_tests_');
      expect(inspect(dbref)).to.equal(
        'new DBRef("namespace", new ObjectId("deadbeefdeadbeefdeadbeef"), "integration_tests_")'
      );
    });

    /**
     * @ignore
     */
    it('Decimal128', function () {
      const dec = Decimal128.fromString('1.42');
      expect(inspect(dec)).to.equal('new Decimal128("1.42")');
    });

    /**
     * @ignore
     */
    it('Double', function () {
      const double = new Double(-42.42);
      expect(inspect(double)).to.equal('new Double(-42.42)');
    });

    /**
     * @ignore
     */
    it('Int32', function () {
      const int = new Int32(42);
      expect(inspect(int)).to.equal('new Int32(42)');
    });

    /**
     * @ignore
     */
    it('Long', function () {
      const long = Long.fromString('42');
      expect(inspect(long)).to.equal('new Long("42")');

      const unsignedLong = Long.fromString('42', true);
      expect(inspect(unsignedLong)).to.equal('new Long("42", true)');
    });

    /**
     * @ignore
     */
    it('MaxKey', function () {
      const maxKey = new MaxKey();
      expect(inspect(maxKey)).to.equal('new MaxKey()');
    });

    /**
     * @ignore
     */
    it('MinKey', function () {
      const minKey = new MinKey();
      expect(inspect(minKey)).to.equal('new MinKey()');
    });

    /**
     * @ignore
     */
    it('Timestamp', function () {
      const timestamp = new Timestamp({ t: 100, i: 1 });
      expect(inspect(timestamp)).to.equal('new Timestamp({ t: 100, i: 1 })');
    });
  });
});
