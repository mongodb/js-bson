'use strict';

const BSON = require('../register-bson');
const EJSON = BSON.EJSON;
const vm = require('vm');

// BSON types
const Binary = BSON.Binary;
const UUID = BSON.UUID;
const Code = BSON.Code;
const DBRef = BSON.DBRef;
const Decimal128 = BSON.Decimal128;
const Double = BSON.Double;
const Int32 = BSON.Int32;
const Long = BSON.Long;
const MaxKey = BSON.MaxKey;
const MinKey = BSON.MinKey;
const ObjectID = BSON.ObjectID;
const ObjectId = BSON.ObjectId;
const BSONRegExp = BSON.BSONRegExp;
const BSONSymbol = BSON.BSONSymbol;
const Timestamp = BSON.Timestamp;

// Several tests in this file can test interop between current library versions and library version 1.1.0, because
// between 1.1.0 and 4.0.0 there was a significant rewrite. To minimize maintenance issues of a hard dependency on
// the old version, these interop tests are inactive by default. To activate, edit the check:test script in package.json:
//   "check:test": "npm i --no-save --force bson@1.1.0 && mocha ./test/node && npm uninstall --no-save --force bson@1.1.0"
//
function getOldBSON() {
  try {
    // do a dynamic resolve to avoid exception when running browser tests
    const file = require.resolve('bson');
    const oldModule = require(file).BSON;
    const funcs = new oldModule.BSON();
    oldModule.serialize = funcs.serialize;
    oldModule.deserialize = funcs.deserialize;
    return oldModule;
  } catch (e) {
    return BSON; // if old bson lib is unavailable, e.g. browser tests, just re-use new BSON
  }
}

const OldBSON = getOldBSON();
const OldObjectID = OldBSON === BSON ? BSON.ObjectId : OldBSON.ObjectID;
const usingOldBSON = OldBSON !== BSON;

describe('Extended JSON', function () {
  let doc = {};

  before(function () {
    const buffer = Buffer.alloc(64);
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
      doubleNumberIntFit: 19007199250000000
    };
  });

  it('should correctly extend an existing mongodb module', function () {
    // Serialize the document
    var json =
      '{"_id":{"$numberInt":"100"},"gh":{"$numberInt":"1"},"binary":{"$binary":{"base64":"AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+Pw==","subType":"00"}},"date":{"$date":{"$numberLong":"1488372056737"}},"code":{"$code":"function() {}","$scope":{"a":{"$numberInt":"1"}}},"dbRef":{"$ref":"tests","$id":{"$numberInt":"1"},"$db":"test"},"decimal":{"$numberDecimal":"100"},"double":{"$numberDouble":"10.1"},"int32":{"$numberInt":"10"},"long":{"$numberLong":"200"},"maxKey":{"$maxKey":1},"minKey":{"$minKey":1},"objectId":{"$oid":"111111111111111111111111"},"objectID":{"$oid":"111111111111111111111111"},"oldObjectID":{"$oid":"111111111111111111111111"},"regexp":{"$regularExpression":{"pattern":"hello world","options":"i"}},"symbol":{"$symbol":"symbol"},"timestamp":{"$timestamp":{"t":0,"i":1000}},"int32Number":{"$numberInt":"300"},"doubleNumber":{"$numberDouble":"200.2"},"longNumberIntFit":{"$numberLong":"7036874417766400"},"doubleNumberIntFit":{"$numberLong":"19007199250000000"}}';

    expect(json).to.equal(EJSON.stringify(doc, null, 0, { relaxed: false }));
  });

  it('should correctly deserialize using the default relaxed mode', function () {
    // Deserialize the document using non strict mode
    var doc1 = EJSON.parse(EJSON.stringify(doc, null, 0));

    // Validate the values
    expect(300).to.equal(doc1.int32Number);
    expect(200.2).to.equal(doc1.doubleNumber);
    expect(0x19000000000000).to.equal(doc1.longNumberIntFit);
    expect(19007199250000000).to.equal(doc1.doubleNumberIntFit);

    // Deserialize the document using strict mode
    doc1 = EJSON.parse(EJSON.stringify(doc, null, 0), { relaxed: false });

    // Validate the values
    expect(doc1.int32Number._bsontype).to.equal('Int32');
    expect(doc1.doubleNumber._bsontype).to.equal('Double');
    expect(doc1.longNumberIntFit._bsontype).to.equal('Long');
    expect(doc1.doubleNumberIntFit._bsontype).to.equal('Long');
  });

  it('should correctly serialize, and deserialize using built-in BSON', function () {
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

  it('should correctly serialize bson types when they are values', function () {
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

  it('should correctly serialize strings', function () {
    const serialized = EJSON.stringify('new string');
    expect(serialized).to.equal('"new string"');
  });

  it('should correctly serialize numbers', function () {
    const serialized = EJSON.stringify(42);
    expect(serialized).to.equal('42');
  });

  it('should correctly serialize non-finite numbers', function () {
    const numbers = { neginf: -Infinity, posinf: Infinity, nan: NaN };
    const serialized = EJSON.stringify(numbers);
    expect(serialized).to.equal(
      '{"neginf":{"$numberDouble":"-Infinity"},"posinf":{"$numberDouble":"Infinity"},"nan":{"$numberDouble":"NaN"}}'
    );
    expect(EJSON.parse(serialized)).to.deep.equal(numbers);
  });

  it('should correctly parse null values', function () {
    expect(EJSON.parse('null')).to.be.null;
    expect(EJSON.parse('[null]')[0]).to.be.null;

    var input = '{"result":[{"_id":{"$oid":"591801a468f9e7024b623939"},"emptyField":null}]}';
    var parsed = EJSON.parse(input);

    expect(parsed).to.deep.equal({
      result: [{ _id: new ObjectId('591801a468f9e7024b623939'), emptyField: null }]
    });
  });

  it('should correctly throw when passed a non-string to parse', function () {
    expect(() => {
      EJSON.parse({});
    }).to.throw;
  });

  it('should allow relaxed parsing by default', function () {
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

  it('should allow regexp', function () {
    const parsedRegExp = EJSON.stringify({ test: /some-regex/i });
    const parsedBSONRegExp = EJSON.stringify(
      { test: new BSONRegExp('some-regex', 'i') },
      { relaxed: true }
    );
    expect(parsedRegExp).to.eql(parsedBSONRegExp);
  });

  it('should serialize from BSON object to EJSON object', function () {
    const doc = {
      binary: new Binary(''),
      code: new Code('function() {}'),
      dbRef: new DBRef('tests', new Int32(1), 'test'),
      decimal128: new Decimal128('128'),
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
      timestamp: new Timestamp(),
      foreignRegExp: vm.runInNewContext('/abc/'),
      foreignDate: vm.runInNewContext('new Date(0)')
    };

    const result = EJSON.serialize(doc, { relaxed: false });
    expect(result).to.deep.equal({
      binary: { $binary: { base64: '', subType: '00' } },
      code: { $code: 'function() {}' },
      dbRef: { $ref: 'tests', $id: { $numberInt: '1' }, $db: 'test' },
      decimal128: { $numberDecimal: '128' },
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
      timestamp: { $timestamp: { t: 0, i: 0 } },
      foreignDate: { $date: { $numberLong: '0' } },
      foreignRegExp: { $regularExpression: { pattern: 'abc', options: '' } }
    });
  });

  it('should deserialize from EJSON object to BSON object', function () {
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
    expect(result.int32.value).to.equal(10);
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

  it('should return a native number for a double in relaxed mode', function () {
    const result = EJSON.deserialize({ test: 34.12 }, { relaxed: true });
    expect(result.test).to.equal(34.12);
    expect(result.test).to.be.a('number');
  });

  it('should work for function-valued and array-valued replacer parameters', function () {
    const doc = { a: new Int32(10), b: new Int32(10) };

    var replacerArray = ['a', '$numberInt'];
    var serialized = EJSON.stringify(doc, replacerArray, 0, { relaxed: false });
    expect(serialized).to.equal('{"a":{"$numberInt":"10"}}');

    serialized = EJSON.stringify(doc, replacerArray);
    expect(serialized).to.equal('{"a":10}');

    var replacerFunc = function (key, value) {
      return key === 'b' ? undefined : value;
    };
    serialized = EJSON.stringify(doc, replacerFunc, 0, { relaxed: false });
    expect(serialized).to.equal('{"a":{"$numberInt":"10"}}');

    serialized = EJSON.stringify(doc, replacerFunc);
    expect(serialized).to.equal('{"a":10}');
  });

  if (!usingOldBSON) {
    it.skip('skipping 4.x/1.x interop tests', () => {});
  } else {
    it('should interoperate 4.x with 1.x versions of this library', function () {
      const buffer = Buffer.alloc(64);
      for (var i = 0; i < buffer.length; i++) {
        buffer[i] = i;
      }
      const [oldBsonObject, newBsonObject] = [OldBSON, BSON].map(bsonModule => {
        const bsonTypes = {
          binary: new bsonModule.Binary(buffer),
          code: new bsonModule.Code('function() {}'),
          dbRef: new bsonModule.DBRef('tests', new Int32(1), 'test'),
          decimal128: new bsonModule.Decimal128.fromString('9991223372036854775807'),
          double: new bsonModule.Double(10.1),
          int32: new bsonModule.Int32(10),
          long: new bsonModule.Long.fromString('1223372036854775807'),
          maxKey: new bsonModule.MaxKey(),
          // minKey: new bsonModule.MinKey(), // broken until #310 is fixed in 1.x
          objectId: bsonModule.ObjectId.createFromHexString('111111111111111111111111'),
          objectID: bsonModule.ObjectID.createFromHexString('111111111111111111111111'),
          bsonRegExp: new bsonModule.BSONRegExp('hello world', 'i'),
          symbol: bsonModule.BSONSymbol
            ? new bsonModule.BSONSymbol('symbol')
            : new bsonModule.Symbol('symbol'),
          timestamp: new bsonModule.Timestamp()
        };
        return bsonTypes;
      });

      const serializationOptions = {};
      const bsonBuffers = {
        oldObjectOldSerializer: OldBSON.serialize(oldBsonObject, serializationOptions),
        oldObjectNewSerializer: BSON.serialize(oldBsonObject, serializationOptions),
        newObjectOldSerializer: OldBSON.serialize(newBsonObject, serializationOptions),
        newObjectNewSerializer: BSON.serialize(newBsonObject, serializationOptions)
      };

      const expectedBufferBase64 =
        'VgEAAAViaW5hcnkAQAAAAAAAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/DWNvZGUADgAAAGZ1bmN0aW9uKCkge30AA2RiUmVmACwAAAACJHJlZgAGAAAAdGVzdHMAECRpZAABAAAAAiRkYgAFAAAAdGVzdAAAE2RlY2ltYWwxMjgA//837RjxE6AdAgAAAABAMAFkb3VibGUAMzMzMzMzJEAQaW50MzIACgAAABJsb25nAP//38RiSvoQf21heEtleQAHb2JqZWN0SWQAERERERERERERERERB29iamVjdElEABEREREREREREREREQtic29uUmVnRXhwAGhlbGxvIHdvcmxkAGkADnN5bWJvbAAHAAAAc3ltYm9sABF0aW1lc3RhbXAAAAAAAAAAAAAA';
      const expectedBuffer = Buffer.from(expectedBufferBase64, 'base64');

      // Regardless of which library version created the objects, and which library version
      // is being used to serialize the objects, validate that the correct BSON is returned.
      expect(expectedBuffer).to.deep.equal(bsonBuffers.newObjectNewSerializer);
      expect(expectedBuffer).to.deep.equal(bsonBuffers.newObjectOldSerializer);
      expect(expectedBuffer).to.deep.equal(bsonBuffers.oldObjectNewSerializer);
      expect(expectedBuffer).to.deep.equal(bsonBuffers.oldObjectOldSerializer);

      // Finally, validate that the BSON buffer above is correctly deserialized back to EJSON by the new library,
      // regardless of which library version's deserializer is used.  This is useful because the 1.x deserializer
      // generates 1.x objects, while the 4.x serializer generates 4.x objects. The 4.x EJSON serializer should
      // be able to handle both.
      const deserializationOptions = { promoteValues: false };
      const deserialized = {
        usingOldDeserializer: OldBSON.deserialize(expectedBuffer, deserializationOptions),
        usingNewDeserializer: BSON.deserialize(expectedBuffer, deserializationOptions)
      };
      // Apparently the Symbol BSON type was deprecated in V4. Symbols in BSON are deserialized as strings in V4
      // Therefore, for this type we know there will be a difference between the V1 library and the V4 library,
      // so remove Symbol from the list of BSON types that are being compared.
      // Browser tests currently don't handle BSON Symbol correctly, so only test this under Node where OldBSON !=== BSON module.
      if (BSON !== OldBSON) {
        expect(deserialized.usingOldDeserializer['symbol'].value).to.equal(
          deserialized.usingNewDeserializer['symbol']
        );
      }
      delete deserialized.usingOldDeserializer['symbol'];
      delete deserialized.usingNewDeserializer['symbol'];

      const ejsonExpected = {
        binary: {
          $binary: {
            base64:
              'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+Pw==',
            subType: '00'
          }
        },
        code: { $code: 'function() {}' },
        dbRef: { $ref: 'tests', $id: { $numberInt: '1' }, $db: 'test' },
        decimal128: { $numberDecimal: '9991223372036854775807' },
        double: { $numberDouble: '10.1' },
        int32: { $numberInt: '10' },
        long: { $numberLong: '1223372036854775807' },
        maxKey: { $maxKey: 1 },
        // minKey: { $minKey: 1 },  // broken until #310 is fixed in 1.x branch
        objectId: { $oid: '111111111111111111111111' },
        objectID: { $oid: '111111111111111111111111' },
        bsonRegExp: { $regularExpression: { pattern: 'hello world', options: 'i' } },
        // symbol: { $symbol: 'symbol' },  // removed because this type is deprecated. See comment above.
        timestamp: { $timestamp: { t: 0, i: 0 } }
      };
      const ejsonSerializeOptions = { relaxed: false };
      const resultOld = EJSON.serialize(deserialized.usingOldDeserializer, ejsonSerializeOptions);
      expect(resultOld).to.deep.equal(ejsonExpected);
      const resultNew = EJSON.serialize(deserialized.usingNewDeserializer, ejsonSerializeOptions);
      expect(resultNew).to.deep.equal(ejsonExpected);
    });

    // Must special-case the test for MinKey, because of #310.  When #310 is fixed and is picked up
    // by mongodb-core, then remove this test case and uncomment the MinKey checks in the test case above
    it('should interop with MinKey 1.x and 4.x, except the case that #310 breaks', function () {
      if (!usingOldBSON) {
        it.skip('interop tests', () => {});
        return;
      }

      const serializationOptions = {};
      const deserializationOptions = { promoteValues: false };

      // when #310 is fixed and the fix makes it into mongodb-core.
      const [oldMinKey, newMinKey] = [OldBSON, BSON].map(bsonModule => {
        const bsonTypes = {
          minKey: new bsonModule.MinKey()
        };
        return bsonTypes;
      });

      const expectedBufferBase64MinKey = 'DQAAAP9taW5LZXkAAA==';
      const expectedBufferMinKey = Buffer.from(expectedBufferBase64MinKey, 'base64');

      const bsonBuffersMinKey = {
        oldObjectOldSerializer: OldBSON.serialize(oldMinKey, serializationOptions),
        oldObjectNewSerializer: BSON.serialize(oldMinKey, serializationOptions),
        newObjectOldSerializer: OldBSON.serialize(newMinKey, serializationOptions),
        newObjectNewSerializer: BSON.serialize(newMinKey, serializationOptions)
      };

      expect(expectedBufferMinKey).to.deep.equal(bsonBuffersMinKey.newObjectNewSerializer);
      // expect(expectedBufferMinKey).to.deep.equal(bsonBuffersMinKey.newObjectOldSerializer);  // this is the case that's broken by #310
      expect(expectedBufferMinKey).to.deep.equal(bsonBuffersMinKey.oldObjectNewSerializer);
      expect(expectedBufferMinKey).to.deep.equal(bsonBuffersMinKey.oldObjectOldSerializer);

      const ejsonExpected = {
        minKey: { $minKey: 1 }
      };

      const deserialized = {
        usingOldDeserializer: OldBSON.deserialize(expectedBufferMinKey, deserializationOptions),
        usingNewDeserializer: BSON.deserialize(expectedBufferMinKey, deserializationOptions)
      };
      const ejsonSerializeOptions = { relaxed: false };
      const resultOld = EJSON.serialize(deserialized.usingOldDeserializer, ejsonSerializeOptions);
      expect(resultOld).to.deep.equal(ejsonExpected);
      const resultNew = EJSON.serialize(deserialized.usingNewDeserializer, ejsonSerializeOptions);
      expect(resultNew).to.deep.equal(ejsonExpected);
    });
  }

  it('should throw if invalid BSON types are input to EJSON serializer', function () {
    const oid = new ObjectId('111111111111111111111111');
    const badBsonType = Object.assign({}, oid, { _bsontype: 'bogus' });
    const badDoc = { bad: badBsonType };
    const badArray = [oid, badDoc];
    // const badMap = new Map([['a', badBsonType], ['b', badDoc], ['c', badArray]]);
    expect(() => EJSON.serialize(badDoc)).to.throw();
    expect(() => EJSON.serialize(badArray)).to.throw();
    // expect(() => EJSON.serialize(badMap)).to.throw(); // uncomment when EJSON supports ES6 Map
  });

  it('should correctly deserialize objects containing __proto__ keys', function () {
    const original = { ['__proto__']: { a: 42 } };
    const serialized = EJSON.stringify(original);
    expect(serialized).to.equal('{"__proto__":{"a":42}}');
    const deserialized = EJSON.parse(serialized);
    expect(deserialized).to.have.deep.ownPropertyDescriptor('__proto__', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: { a: 42 }
    });
    expect(deserialized.__proto__.a).to.equal(42);
  });

  context('circular references', () => {
    it('should throw a helpful error message for input with circular references', function () {
      const obj = {
        some: {
          property: {
            array: []
          }
        }
      };
      obj.some.property.array.push(obj.some);
      expect(() => EJSON.serialize(obj)).to.throw(`\
Converting circular structure to EJSON:
    (root) -> some -> property -> array -> index 0
                \\-----------------------------/`);
    });

    it('should throw a helpful error message for input with circular references, one-level nested', function () {
      const obj = {};
      obj.obj = obj;
      expect(() => EJSON.serialize(obj)).to.throw(`\
Converting circular structure to EJSON:
    (root) -> obj
       \\-------/`);
    });

    it('should throw a helpful error message for input with circular references, one-level nested inside base object', function () {
      const obj = {};
      obj.obj = obj;
      expect(() => EJSON.serialize({ foo: obj })).to.throw(`\
Converting circular structure to EJSON:
    (root) -> foo -> obj
               \\------/`);
    });

    it('should throw a helpful error message for input with circular references, pointing back to base object', function () {
      const obj = { foo: {} };
      obj.foo.obj = obj;
      expect(() => EJSON.serialize(obj)).to.throw(`\
Converting circular structure to EJSON:
    (root) -> foo -> obj
       \\--------------/`);
    });
  });

  context('when dealing with legacy extended json', function () {
    describe('.stringify', function () {
      context('when serializing binary', function () {
        it('stringifies $binary and $type', function () {
          const binary = new Binary(new Uint8Array([1, 2, 3, 4, 5]));
          const doc = { field: binary };
          const json = EJSON.stringify(doc, { legacy: true });
          expect(json).to.equal('{"field":{"$binary":"AQIDBAU=","$type":"00"}}');
        });
      });

      context('when serializing date', function () {
        context('when using strict mode', function () {
          it('stringifies $date with with ISO-8601 string', function () {
            const date = new Date(1452124800000);
            const doc = { field: date };
            const json = EJSON.stringify(doc, { legacy: true, relaxed: false });
            expect(json).to.equal('{"field":{"$date":"2016-01-07T00:00:00Z"}}');
          });
        });

        context('when using relaxed mode', function () {
          it('stringifies $date with with millis since epoch', function () {
            const date = new Date(1452124800000);
            const doc = { field: date };
            const json = EJSON.stringify(doc, { legacy: true, relaxed: true });
            expect(json).to.equal('{"field":{"$date":1452124800000}}');
          });
        });
      });

      context('when serializing regex', function () {
        it('stringifies $regex and $options', function () {
          const regexp = new BSONRegExp('hello world', 'i');
          const doc = { field: regexp };
          const json = EJSON.stringify(doc, { legacy: true });
          expect(json).to.equal('{"field":{"$regex":"hello world","$options":"i"}}');
        });
      });

      context('when serializing dbref', function () {
        it('stringifies $ref and $id', function () {
          const dbRef = new DBRef('tests', new Int32(1));
          const doc = { field: dbRef };
          const json = EJSON.stringify(doc, { legacy: true });
          expect(json).to.equal('{"field":{"$ref":"tests","$id":1}}');
        });
      });

      context('when serializing dbref', function () {
        it('stringifies $ref and $id', function () {
          const dbRef = new DBRef('tests', new Int32(1));
          const doc = { field: dbRef };
          const json = EJSON.stringify(doc, { legacy: true });
          expect(json).to.equal('{"field":{"$ref":"tests","$id":1}}');
        });
      });

      context('when serializing int32', function () {
        it('stringifies the number', function () {
          const int32 = new Int32(1);
          const doc = { field: int32 };
          const json = EJSON.stringify(doc, { legacy: true });
          expect(json).to.equal('{"field":1}');
        });
      });

      context('when serializing double', function () {
        it('stringifies the number', function () {
          const doub = new Double(1.1);
          const doc = { field: doub };
          const json = EJSON.stringify(doc, { legacy: true });
          expect(json).to.equal('{"field":1.1}');
        });
      });
    });

    describe('.parse', function () {
      context('when deserializing binary', function () {
        it('parses $binary and $type', function () {
          const binary = new Binary(new Uint8Array([1, 2, 3, 4, 5]));
          const doc = { field: binary };
          const bson = EJSON.parse('{"field":{"$binary":"AQIDBAU=","$type":"00"}}', {
            legacy: true
          });
          expect(bson).to.deep.equal(doc);
        });
      });

      context('when deserializing date', function () {
        context('when using strict mode', function () {
          it('parses $date with with ISO-8601 string', function () {
            const date = new Date(1452124800000);
            const doc = { field: date };
            const bson = EJSON.parse('{"field":{"$date":"2016-01-07T00:00:00Z"}}', {
              legacy: true,
              relaxed: false
            });
            expect(bson).to.deep.equal(doc);
          });
        });

        context('when using relaxed mode', function () {
          it('parses $date number with millis since epoch', function () {
            const date = new Date(1452124800000);
            const doc = { field: date };
            const bson = EJSON.parse('{"field":{"$date":1452124800000}}', {
              legacy: true,
              relaxed: true
            });
            expect(bson).to.deep.equal(doc);
          });
        });
      });

      context('when deserializing regex', function () {
        it('parses $regex and $options', function () {
          const regexp = new BSONRegExp('hello world', 'i');
          const doc = { field: regexp };
          const bson = EJSON.parse('{"field":{"$regex":"hello world","$options":"i"}}', {
            legacy: true
          });
          expect(bson).to.deep.equal(doc);
        });
      });

      context('when deserializing dbref', function () {
        it('parses $ref and $id', function () {
          const dbRef = new DBRef('tests', 1);
          const doc = { field: dbRef };
          const bson = EJSON.parse('{"field":{"$ref":"tests","$id":1}}', {
            legacy: true
          });
          expect(bson).to.deep.equal(doc);
        });
      });

      context('when deserializing int32', function () {
        it('parses the number', function () {
          const doc = { field: 1 };
          const bson = EJSON.parse('{"field":1}', { legacy: true });
          expect(bson).to.deep.equal(doc);
        });

        it('parses the numberInt without doc', function () {
          const value = 1;
          const bson = EJSON.parse('{ "$numberInt": "1" }');
          expect(bson).to.deep.equal(value);
        });

        it('parses the numberInt', function () {
          const doc = { field: 1 };
          const bson = EJSON.parse('{"field": {"$numberInt": "1"}}');
          expect(bson).to.deep.equal(doc);
        });

        it('parses the numberInt and stringify', function () {
          const doc = { field: 1 };
          const bson = EJSON.parse('{"field": {"$numberInt": "1"}}');
          expect(EJSON.stringify(bson)).to.deep.equal(JSON.stringify(doc));
        });
      });

      context('when deserializing double', function () {
        it('parses the number', function () {
          const doc = { field: 1.1 };
          const bson = EJSON.parse('{"field":1.1}', { legacy: true });
          expect(bson).to.deep.equal(doc);
        });
      });
    });
  });

  describe('UUID stringify', () => {
    const uuid = new UUID();
    const stringifiedPlainUUID = EJSON.stringify({ u: uuid });
    it('should return same values for UUID.toBinary() and UUID', () => {
      const stringifiedToBinary = EJSON.stringify({ u: uuid.toBinary() });
      expect(stringifiedToBinary).to.deep.equal(stringifiedPlainUUID);
    });
    it('should serialize to correct subType', () => {
      const stringifiedUUIDtoObject = JSON.parse(stringifiedPlainUUID);
      const stringifiedBinaryNewUUIDSubType = '04';
      expect(stringifiedUUIDtoObject.u.$binary.subType).to.equal(stringifiedBinaryNewUUIDSubType);
    });
  });

  describe('UUID parse', () => {
    const uuid = new UUID();
    const stringifiedPlainUUID = EJSON.stringify({ u: uuid });
    it('should return same values for UUID.toBinary() and UUID', () => {
      const stringifiedToBinary = EJSON.stringify({ u: uuid.toBinary() });
      const parsedToBinary = EJSON.parse(stringifiedToBinary);
      const parsedPlainUUID = EJSON.parse(stringifiedPlainUUID);
      expect(parsedToBinary).to.deep.equal(parsedPlainUUID);
    });
    it('should parse both input formats the same way', () => {
      const parsedUndashedInput = EJSON.parse(
        `{"u":{"$binary":{"base64":"vDzrMPEAQOGkA8wGUNSOxw==","subType":"04"}}}`
      );
      const parsedDashedInput = EJSON.parse(
        `{"u":{"$uuid":"bc3ceb30-f100-40e1-a403-cc0650d48ec7"}}`
      );
      expect(parsedUndashedInput).to.deep.equal(parsedDashedInput);
    });

    it('should return UUID object when deserializing UUID subtype', () => {
      const exampleUUID = new BSON.UUID('878dac12-01cc-4830-b271-cbc8518e63ad');
      const stringifiedUUID = EJSON.stringify({ uuid: exampleUUID });
      const parsedUUID = EJSON.parse(stringifiedUUID);
      const expectedResult = {
        uuid: new UUID('878dac12-01cc-4830-b271-cbc8518e63ad')
      };
      expect(parsedUUID).to.deep.equal(expectedResult);
    });
  });
});
