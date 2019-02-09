'use strict';

const assert = require('assert');
const expect = require('chai').expect;
const BSON = require('../../lib/bson');
const EJSON = BSON.EJSON;

// BSON types
const Binary = BSON.Binary;
const Code = BSON.Code;
const DBRef = BSON.DBRef;
const Decimal128 = BSON.Decimal128;
const Double = BSON.Double;
const Int32 = BSON.Int32;
const Long = BSON.Long;
const MaxKey = BSON.MaxKey;
const MinKey = BSON.MinKey;
const OldObjectID = require('mongodb').ObjectID; // use old ObjectID class because MongoDB drivers still return it
const ObjectID = BSON.ObjectID;
const ObjectId = BSON.ObjectId;
const BSONRegExp = BSON.BSONRegExp;
const BSONSymbol = BSON.BSONSymbol;
const Timestamp = BSON.Timestamp;

describe('Extended JSON', function() {
  let doc = {};

  before(function() {
    const buffer = new Buffer(64);
    for (var i = 0; i < buffer.length; i++) buffer[i] = i;
    const date = new Date();
    date.setTime(1488372056737);
    doc = {
      _id: new Int32(100),
      gh: new Int32(1),
      binary: new Binary(buffer),
      date: date,
      code: new Code('function() {}', { a: new Int32(1) }),
      dbRef: new DBRef('tests', new Int32(1), 'test'),
      decimal: Decimal128.fromString('100'),
      double: new Double(10.1),
      int32: new Int32(10),
      long: Long.fromNumber(200),
      maxKey: new MaxKey(),
      minKey: new MinKey(),
      objectId: ObjectId.createFromHexString('111111111111111111111111'),
      objectID: ObjectID.createFromHexString('111111111111111111111111'),
      oldObjectID: OldObjectID.createFromHexString('111111111111111111111111'),
      regexp: new BSONRegExp('hello world', 'i'),
      symbol: new BSONSymbol('symbol'),
      timestamp: Timestamp.fromNumber(1000),
      int32Number: 300,
      doubleNumber: 200.2,
      longNumberIntFit: 0x19000000000000,
      doubleNumberIntFit: 19007199250000000.12
    };
  });

  it('should correctly extend an existing mongodb module', function() {
    // Serialize the document
    var json =
      '{"_id":{"$numberInt":"100"},"gh":{"$numberInt":"1"},"binary":{"$binary":{"base64":"AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+Pw==","subType":"00"}},"date":{"$date":{"$numberLong":"1488372056737"}},"code":{"$code":"function() {}","$scope":{"a":{"$numberInt":"1"}}},"dbRef":{"$ref":"tests","$id":{"$numberInt":"1"},"$db":"test"},"decimal":{"$numberDecimal":"100"},"double":{"$numberDouble":"10.1"},"int32":{"$numberInt":"10"},"long":{"$numberLong":"200"},"maxKey":{"$maxKey":1},"minKey":{"$minKey":1},"objectId":{"$oid":"111111111111111111111111"},"objectID":{"$oid":"111111111111111111111111"},"oldObjectID":{"$oid":"111111111111111111111111"},"regexp":{"$regularExpression":{"pattern":"hello world","options":"i"}},"symbol":{"$symbol":"symbol"},"timestamp":{"$timestamp":{"t":0,"i":1000}},"int32Number":{"$numberInt":"300"},"doubleNumber":{"$numberDouble":"200.2"},"longNumberIntFit":{"$numberLong":"7036874417766400"},"doubleNumberIntFit":{"$numberLong":"19007199250000000"}}';

    assert.equal(json, EJSON.stringify(doc, null, 0, { relaxed: false }));
  });

  it('should correctly deserialize using the default relaxed mode', function() {
    // Deserialize the document using non strict mode
    var doc1 = EJSON.parse(EJSON.stringify(doc, null, 0));

    // Validate the values
    assert.equal(300, doc1.int32Number);
    assert.equal(200.2, doc1.doubleNumber);
    assert.equal(0x19000000000000, doc1.longNumberIntFit);
    assert.equal(19007199250000000.12, doc1.doubleNumberIntFit);

    // Deserialize the document using strict mode
    doc1 = EJSON.parse(EJSON.stringify(doc, null, 0), { relaxed: false });

    // Validate the values
    expect(doc1.int32Number._bsontype).to.equal('Int32');
    expect(doc1.doubleNumber._bsontype).to.equal('Double');
    expect(doc1.longNumberIntFit._bsontype).to.equal('Long');
    expect(doc1.doubleNumberIntFit._bsontype).to.equal('Long');
  });

  it('should correctly serialize, and deserialize using built-in BSON', function() {
    // Create a doc
    var doc1 = {
      int32: new Int32(10)
    };

    // Serialize the document
    var text = EJSON.stringify(doc1, null, 0, { relaxed: false });
    expect(text).to.equal('{"int32":{"$numberInt":"10"}}');

    // Deserialize the json in strict and non strict mode
    var doc2 = EJSON.parse(text, { relaxed: false });
    expect(doc2.int32._bsontype).to.equal('Int32');
    doc2 = EJSON.parse(text);
    expect(doc2.int32).to.equal(10);
  });

  it('should correctly serialize bson types when they are values', function() {
    var serialized = EJSON.stringify(new ObjectId('591801a468f9e7024b6235ea'), { relaxed: false });
    expect(serialized).to.equal('{"$oid":"591801a468f9e7024b6235ea"}');
    serialized = EJSON.stringify(new ObjectID('591801a468f9e7024b6235ea'), { relaxed: false });
    expect(serialized).to.equal('{"$oid":"591801a468f9e7024b6235ea"}');
    serialized = EJSON.stringify(new OldObjectID('591801a468f9e7024b6235ea'), { relaxed: false });
    expect(serialized).to.equal('{"$oid":"591801a468f9e7024b6235ea"}');

    serialized = EJSON.stringify(new Int32(42), { relaxed: false });
    expect(serialized).to.equal('{"$numberInt":"42"}');
    serialized = EJSON.stringify(
      {
        _id: { $nin: [new ObjectId('591801a468f9e7024b6235ea')] }
      },
      { relaxed: false }
    );
    expect(serialized).to.equal('{"_id":{"$nin":[{"$oid":"591801a468f9e7024b6235ea"}]}}');
    serialized = EJSON.stringify(
      {
        _id: { $nin: [new ObjectID('591801a468f9e7024b6235ea')] }
      },
      { relaxed: false }
    );
    expect(serialized).to.equal('{"_id":{"$nin":[{"$oid":"591801a468f9e7024b6235ea"}]}}');
    serialized = EJSON.stringify(
      {
        _id: { $nin: [new OldObjectID('591801a468f9e7024b6235ea')] }
      },
      { relaxed: false }
    );
    expect(serialized).to.equal('{"_id":{"$nin":[{"$oid":"591801a468f9e7024b6235ea"}]}}');

    serialized = EJSON.stringify(new Binary(new Uint8Array([1, 2, 3, 4, 5])), { relaxed: false });
    expect(serialized).to.equal('{"$binary":{"base64":"AQIDBAU=","subType":"00"}}');
  });

  it('should correctly parse null values', function() {
    expect(EJSON.parse('null')).to.be.null;
    expect(EJSON.parse('[null]')[0]).to.be.null;

    var input = '{"result":[{"_id":{"$oid":"591801a468f9e7024b623939"},"emptyField":null}]}';
    var parsed = EJSON.parse(input);

    expect(parsed).to.deep.equal({
      result: [{ _id: new ObjectId('591801a468f9e7024b623939'), emptyField: null }]
    });
  });

  it('should correctly throw when passed a non-string to parse', function() {
    expect(() => {
      EJSON.parse({});
    }).to.throw;
  });

  it('should allow relaxed parsing by default', function() {
    const dt = new Date(1452124800000);
    const inputObject = {
      int: { $numberInt: '500' },
      long: { $numberLong: '42' },
      double: { $numberDouble: '24' },
      date: { $date: { $numberLong: '1452124800000' } }
    };

    const parsed = EJSON.parse(JSON.stringify(inputObject));
    expect(parsed).to.eql({
      int: 500,
      long: 42,
      double: 24,
      date: dt
    });
  });

  it('should allow regexp', function() {
    const parsedRegExp = EJSON.stringify({ test: /some-regex/i });
    const parsedBSONRegExp = EJSON.stringify(
      { test: new BSONRegExp('some-regex', 'i') },
      { relaxed: true }
    );
    expect(parsedRegExp).to.eql(parsedBSONRegExp);
  });

  it('should serialize from BSON object to EJSON object', function() {
    const doc = {
      binary: new Binary(''),
      code: new Code('function() {}'),
      dbRef: new DBRef('tests', new Int32(1), 'test'),
      decimal128: new Decimal128(128),
      double: new Double(10.1),
      int32: new Int32(10),
      long: new Long(234),
      maxKey: new MaxKey(),
      minKey: new MinKey(),
      objectId: ObjectId.createFromHexString('111111111111111111111111'),
      objectID: ObjectID.createFromHexString('111111111111111111111111'),
      oldObjectID: OldObjectID.createFromHexString('111111111111111111111111'),
      bsonRegExp: new BSONRegExp('hello world', 'i'),
      symbol: new BSONSymbol('symbol'),
      timestamp: new Timestamp()
    };

    const result = EJSON.serialize(doc, { relaxed: false });
    expect(result).to.deep.equal({
      binary: { $binary: { base64: '', subType: '00' } },
      code: { $code: 'function() {}' },
      dbRef: { $ref: 'tests', $id: { $numberInt: '1' }, $db: 'test' },
      decimal128: { $numberDecimal: '0E-6176' },
      double: { $numberDouble: '10.1' },
      int32: { $numberInt: '10' },
      long: { $numberLong: '234' },
      maxKey: { $maxKey: 1 },
      minKey: { $minKey: 1 },
      objectId: { $oid: '111111111111111111111111' },
      objectID: { $oid: '111111111111111111111111' },
      oldObjectID: { $oid: '111111111111111111111111' },
      bsonRegExp: { $regularExpression: { pattern: 'hello world', options: 'i' } },
      symbol: { $symbol: 'symbol' },
      timestamp: { $timestamp: { t: 0, i: 0 } }
    });
  });

  it('should deserialize from EJSON object to BSON object', function() {
    const doc = {
      binary: { $binary: { base64: '', subType: '00' } },
      code: { $code: 'function() {}' },
      dbRef: { $ref: 'tests', $id: { $numberInt: '1' }, $db: 'test' },
      decimal128: { $numberDecimal: '0E-6176' },
      double: { $numberDouble: '10.1' },
      int32: { $numberInt: '10' },
      long: { $numberLong: '234' },
      maxKey: { $maxKey: 1 },
      minKey: { $minKey: 1 },
      objectId: { $oid: '111111111111111111111111' },
      objectID: { $oid: '111111111111111111111111' },
      oldObjectID: { $oid: '111111111111111111111111' },
      bsonRegExp: { $regularExpression: { pattern: 'hello world', options: 'i' } },
      symbol: { $symbol: 'symbol' },
      timestamp: { $timestamp: { t: 0, i: 0 } }
    };

    const result = EJSON.deserialize(doc, { relaxed: false });

    // binary
    expect(result.binary).to.be.an.instanceOf(BSON.Binary);
    // code
    expect(result.code).to.be.an.instanceOf(BSON.Code);
    expect(result.code.code).to.equal('function() {}');
    // dbRef
    expect(result.dbRef).to.be.an.instanceOf(BSON.DBRef);
    expect(result.dbRef.collection).to.equal('tests');
    expect(result.dbRef.db).to.equal('test');
    // decimal128
    expect(result.decimal128).to.be.an.instanceOf(BSON.Decimal128);
    // double
    expect(result.double).to.be.an.instanceOf(BSON.Double);
    expect(result.double.value).to.equal(10.1);
    // int32
    expect(result.int32).to.be.an.instanceOf(BSON.Int32);
    expect(result.int32.value).to.equal('10');
    //long
    expect(result.long).to.be.an.instanceOf(BSON.Long);
    // maxKey
    expect(result.maxKey).to.be.an.instanceOf(BSON.MaxKey);
    // minKey
    expect(result.minKey).to.be.an.instanceOf(BSON.MinKey);
    // objectID
    expect(result.objectId.toString()).to.equal('111111111111111111111111');
    expect(result.objectID.toString()).to.equal('111111111111111111111111');
    expect(result.oldObjectID.toString()).to.equal('111111111111111111111111');
    //bsonRegExp
    expect(result.bsonRegExp).to.be.an.instanceOf(BSON.BSONRegExp);
    expect(result.bsonRegExp.pattern).to.equal('hello world');
    expect(result.bsonRegExp.options).to.equal('i');
    // symbol
    expect(result.symbol.toString()).to.equal('symbol');
    // timestamp
    expect(result.timestamp).to.be.an.instanceOf(BSON.Timestamp);
  });

  it('should return a native number for a double in relaxed mode', function() {
    const result = EJSON.deserialize({ test: 34.12 }, { relaxed: true });
    expect(result.test).to.equal(34.12);
    expect(result.test).to.be.a('number');
  });

  it('should work for function-valued and array-valued replacer parameters', function() {
    const doc = { a: new Int32(10), b: new Int32(10) };

    var replacerArray = ['a', '$numberInt'];
    var serialized = EJSON.stringify(doc, replacerArray, 0, { relaxed: false });
    expect(serialized).to.equal('{"a":{"$numberInt":"10"}}');

    serialized = EJSON.stringify(doc, replacerArray);
    expect(serialized).to.equal('{"a":10}');

    var replacerFunc = function (key, value) { return key === 'b' ? undefined : value; }
    serialized = EJSON.stringify(doc, replacerFunc, 0, { relaxed: false });
    expect(serialized).to.equal('{"a":{"$numberInt":"10"}}');

    serialized = EJSON.stringify(doc, replacerFunc);
    expect(serialized).to.equal('{"a":10}');
  });
});
