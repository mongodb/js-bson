import * as BSON from '../register-bson';
const EJSON = BSON.EJSON;
import * as vm from 'node:vm';
import { expect } from 'chai';
import { BSONVersionError, BSONRuntimeError } from '../../src';
import { BSONError } from '../register-bson';

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
const ObjectId = BSON.ObjectId;
const BSONRegExp = BSON.BSONRegExp;
const BSONSymbol = BSON.BSONSymbol;
const Timestamp = BSON.Timestamp;

describe('Extended JSON', function () {
  let doc = {};

  before(function () {
    const buffer = Buffer.alloc(64);
    for (let i = 0; i < buffer.length; i++) buffer[i] = i;
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
    // TODO(NODE-4377): doubleNumberIntFit should be a double not a $numberLong
    const json =
      '{"_id":{"$numberInt":"100"},"gh":{"$numberInt":"1"},"binary":{"$binary":{"base64":"AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+Pw==","subType":"00"}},"date":{"$date":{"$numberLong":"1488372056737"}},"code":{"$code":"function() {}","$scope":{"a":{"$numberInt":"1"}}},"dbRef":{"$ref":"tests","$id":{"$numberInt":"1"},"$db":"test"},"decimal":{"$numberDecimal":"100"},"double":{"$numberDouble":"10.1"},"int32":{"$numberInt":"10"},"long":{"$numberLong":"200"},"maxKey":{"$maxKey":1},"minKey":{"$minKey":1},"objectId":{"$oid":"111111111111111111111111"},"regexp":{"$regularExpression":{"pattern":"hello world","options":"i"}},"symbol":{"$symbol":"symbol"},"timestamp":{"$timestamp":{"t":0,"i":1000}},"int32Number":{"$numberInt":"300"},"doubleNumber":{"$numberDouble":"200.2"},"longNumberIntFit":{"$numberLong":"7036874417766400"},"doubleNumberIntFit":{"$numberLong":"19007199250000000"}}';

    expect(json).to.equal(EJSON.stringify(doc, null, 0, { relaxed: false }));
  });

  it('should correctly deserialize using the default relaxed mode (relaxed=true)', function () {
    // Deserialize the document using relaxed=true mode
    let doc1 = EJSON.parse(EJSON.stringify(doc, null, 0));

    // Validate the values
    expect(300).to.equal(doc1.int32Number);
    expect(200.2).to.equal(doc1.doubleNumber);
    expect(0x19000000000000).to.equal(doc1.longNumberIntFit);
    expect(19007199250000000).to.equal(doc1.doubleNumberIntFit);

    // Deserialize the document using relaxed=false
    doc1 = EJSON.parse(EJSON.stringify(doc, null, 0), { relaxed: false });

    // Validate the values
    expect(doc1.int32Number._bsontype).to.equal('Int32');
    expect(doc1.doubleNumber._bsontype).to.equal('Double');
    expect(doc1.longNumberIntFit._bsontype).to.equal('Long');
    // TODO(NODE-4377): EJSON should not try to make Longs from large ints
    expect(doc1.doubleNumberIntFit._bsontype).to.equal('Long');
  });

  it('should correctly serialize, and deserialize using built-in BSON', function () {
    // Create a doc
    const doc1 = {
      int32: new Int32(10)
    };

    // Serialize the document
    const text = EJSON.stringify(doc1, null, 0, { relaxed: false });
    expect(text).to.equal('{"int32":{"$numberInt":"10"}}');

    // Deserialize the json in relaxed=false mode
    let doc2 = EJSON.parse(text, { relaxed: false });
    expect(doc2.int32._bsontype).to.equal('Int32');
    // Deserialize the json in relaxed=true mode
    doc2 = EJSON.parse(text);
    expect(doc2.int32).to.equal(10);
  });

  it('should correctly serialize bson types when they are values', function () {
    let serialized = EJSON.stringify(new ObjectId('591801a468f9e7024b6235ea'), { relaxed: false });
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

    const input = '{"result":[{"_id":{"$oid":"591801a468f9e7024b623939"},"emptyField":null}]}';
    const parsed = EJSON.parse(input);

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
      binary: new Binary(new Uint8Array([0, 0, 0]), 0xef),
      code: new Code('function() {}'),
      dbRef: new DBRef('tests', new Int32(1), 'test'),
      decimal128: new Decimal128('128'),
      double: new Double(10.1),
      int32: new Int32(10),
      long: new Long(234),
      maxKey: new MaxKey(),
      minKey: new MinKey(),
      objectId: ObjectId.createFromHexString('111111111111111111111111'),
      bsonRegExp: new BSONRegExp('hello world', 'i'),
      symbol: new BSONSymbol('symbol'),
      timestamp: new Timestamp(),
      foreignRegExp: vm.runInNewContext('/abc/'),
      foreignDate: vm.runInNewContext('new Date(0)')
    };

    const result = EJSON.serialize(doc, { relaxed: false });
    expect(result).to.deep.equal({
      binary: { $binary: { base64: 'AAAA', subType: 'ef' } },
      code: { $code: 'function() {}' },
      dbRef: { $ref: 'tests', $id: { $numberInt: '1' }, $db: 'test' },
      decimal128: { $numberDecimal: '128' },
      double: { $numberDouble: '10.1' },
      int32: { $numberInt: '10' },
      long: { $numberLong: '234' },
      maxKey: { $maxKey: 1 },
      minKey: { $minKey: 1 },
      objectId: { $oid: '111111111111111111111111' },
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

    const replacerArray = ['a', '$numberInt'];
    let serialized = EJSON.stringify(doc, replacerArray, 0, { relaxed: false });
    expect(serialized).to.equal('{"a":{"$numberInt":"10"}}');

    serialized = EJSON.stringify(doc, replacerArray);
    expect(serialized).to.equal('{"a":10}');

    const replacerFunc = function (key, value) {
      return key === 'b' ? undefined : value;
    };
    serialized = EJSON.stringify(doc, replacerFunc, 0, { relaxed: false });
    expect(serialized).to.equal('{"a":{"$numberInt":"10"}}');

    serialized = EJSON.stringify(doc, replacerFunc);
    expect(serialized).to.equal('{"a":10}');
  });

  it.skip('should throw if invalid BSON types are input to EJSON serializer', function () {
    // TODO(NODE-4952): Increase EJSON strictness w.r.t _bsontype validation
    const oid = new ObjectId('111111111111111111111111');
    const badBsonType = new ObjectId('111111111111111111111111');
    Object.defineProperty(badBsonType, '_bsontype', { value: 'bogus' });
    const badDoc = { bad: badBsonType };
    const badArray = [oid, badDoc];
    // const badMap = new Map([['a', badBsonType], ['b', badDoc], ['c', badArray]]);
    expect(() => EJSON.serialize(badDoc)).to.throw(/invalid _bsontype/);
    expect(() => EJSON.serialize({ badArray })).to.throw(/invalid _bsontype/);
    // expect(() => EJSON.serialize(badMap)).to.throw(); // uncomment when EJSON supports ES6 Map
  });

  it('should correctly deserialize objects containing __proto__ keys', function () {
    const original = { ['__proto__']: { a: 42 } };
    const serialized = EJSON.stringify(original);
    expect(serialized).to.equal('{"__proto__":{"a":42}}');
    const deserialized = EJSON.parse(serialized);
    expect(deserialized).to.have.ownPropertyDescriptor('__proto__', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: { a: 42 }
    });
    expect(deserialized.__proto__.a).to.equal(42);
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
        context('when using relaxed=false mode', function () {
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
        context('when using relaxed=false mode', function () {
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

        context('when using relaxed=true mode', function () {
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

        context('when using useBigInt64=true', function () {
          it('parses $date.$numberLong with millis since epoch', function () {
            const date = new Date(1676315495987);
            const doc = { field: date };
            const stringified = EJSON.stringify(doc, { relaxed: false });
            const parsedDoc = EJSON.parse(stringified, { useBigInt64: true, relaxed: false });
            expect(parsedDoc).to.deep.equal(doc);
          });
        });

        context('when deserializing object with invalid $date key', function () {
          it('throws a BSONRuntimeError', function () {
            const doc = { field: { $date: new ArrayBuffer(10) } };
            const s = EJSON.stringify(doc, { relaxed: false });
            expect(() => {
              EJSON.parse(s, { relaxed: false });
            }).to.throw(BSONRuntimeError, /Unrecognized type/i);
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

  it('should only enumerate own property keys from input objects', () => {
    const input = { a: 1 };
    Object.setPrototypeOf(input, { b: 2 });
    const string = EJSON.stringify(input);
    expect(string).to.not.include(`"b":`);
    const result = JSON.parse(string);
    expect(result).to.deep.equal({ a: 1 });
  });

  describe('ignoreUndefined option', () => {
    it('should convert undefined to null by default', () => {
      const doc = { a: 1, b: undefined, c: 'test' };
      const serialized = EJSON.stringify(doc);
      expect(serialized).to.equal('{"a":1,"b":null,"c":"test"}');
    });

    it('should omit undefined values when ignoreUndefined is true', () => {
      const doc = { a: 1, b: undefined, c: 'test' };
      const serialized = EJSON.stringify(doc, { ignoreUndefined: true });
      expect(serialized).to.equal('{"a":1,"c":"test"}');
    });

    it('should handle nested undefined values with ignoreUndefined: true', () => {
      const doc = { a: 1, nested: { b: undefined, c: 2 }, d: 'test' };
      const serialized = EJSON.stringify(doc, { ignoreUndefined: true });
      expect(serialized).to.equal('{"a":1,"nested":{"c":2},"d":"test"}');
    });

    it('should handle nested undefined values without ignoreUndefined (default behavior)', () => {
      const doc = { a: 1, nested: { b: undefined, c: 2 }, d: 'test' };
      const serialized = EJSON.stringify(doc);
      expect(serialized).to.equal('{"a":1,"nested":{"b":null,"c":2},"d":"test"}');
    });

    it('should handle undefined in arrays with ignoreUndefined: true', () => {
      const doc = { arr: [1, undefined, 3] };
      const serialized = EJSON.stringify(doc, { ignoreUndefined: true });
      // JSON.stringify converts undefined array elements to null
      expect(serialized).to.equal('{"arr":[1,null,3]}');
    });

    it('should handle undefined in arrays without ignoreUndefined (default behavior)', () => {
      const doc = { arr: [1, undefined, 3] };
      const serialized = EJSON.stringify(doc);
      expect(serialized).to.equal('{"arr":[1,null,3]}');
    });

    it('should handle object with all undefined values with ignoreUndefined: true', () => {
      const doc = { a: undefined, b: undefined };
      const serialized = EJSON.stringify(doc, { ignoreUndefined: true });
      expect(serialized).to.equal('{}');
    });

    it('should work with other options like relaxed', () => {
      const doc = { a: new Int32(10), b: undefined, c: new Double(3.14) };
      const serialized = EJSON.stringify(doc, { ignoreUndefined: true, relaxed: false });
      expect(serialized).to.equal('{"a":{"$numberInt":"10"},"c":{"$numberDouble":"3.14"}}');
    });

    it('should work with replacer function', () => {
      const doc = { a: 1, b: undefined, c: 2 };
      const replacer = (key: string, value: unknown) => (key === 'a' ? 100 : value);
      const serialized = EJSON.stringify(doc, replacer, 0, { ignoreUndefined: true });
      expect(serialized).to.equal('{"a":100,"c":2}');
    });

    it('should work with space parameter', () => {
      const doc = { a: 1, b: undefined };
      const serialized = EJSON.stringify(doc, undefined, 2, { ignoreUndefined: true });
      expect(serialized).to.equal('{\n  "a": 1\n}');
    });
  });

  it(`throws if Symbol.for('@@mdb.bson.version') is the wrong version in EJSON.stringify`, () => {
    expect(() =>
      EJSON.stringify({
        a: { _bsontype: 'Int32', value: 2, [Symbol.for('@@mdb.bson.version')]: 1 }
      })
    ).to.throw(BSONVersionError, /Unsupported BSON version/i);
  });

  context('Map objects', function () {
    it('serializes an empty Map object', () => {
      const input = new Map();
      expect(EJSON.stringify(input)).to.equal('{}');
    });

    it('serializes a nested Map object', () => {
      const input = new Map([
        [
          'a',
          new Map([
            ['a', 100],
            ['b', 200]
          ])
        ]
      ]);

      const str = EJSON.stringify(input);
      expect(str).to.equal('{"a":{"a":100,"b":200}}');
    });

    it('serializes a Map with one string key', () => {
      const input = new Map([['a', 100]]);

      const str = EJSON.stringify(input);
      expect(str).to.equal('{"a":100}');
    });

    it('throws BSONError when passed Map object with non-string keys', () => {
      const input: Map<number, unknown> = new Map([
        [1, 100],
        [2, 200]
      ]);

      expect(() => EJSON.stringify(input)).to.throw(BSONError);
    });
  });
});
