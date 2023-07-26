import { Buffer } from 'buffer';
import { BSON, BSONError, EJSON, ObjectId } from '../register-bson';
import * as util from 'util';
import { expect } from 'chai';
import { bufferFromHexArray } from './tools/utils';
import { getSymbolFrom } from './tools/utils';
import { isBufferOrUint8Array } from './tools/utils';

describe('ObjectId', function () {
  describe('static createFromTime()', () => {
    it('creates an objectId with user defined value in the timestamp field', function () {
      const a = ObjectId.createFromTime(1);
      expect(a.id.slice(0, 4)).to.deep.equal(Buffer.from([0, 0, 0, 1]));
      expect(a.getTimestamp()).to.deep.equal(new Date(1 * 1000));
      expect(a.getTimestamp().getTime()).to.equal(1000);
    });
  });

  describe('getTimestamp()', () => {
    it('fetches the big endian int32 leading the Oid and create a Date instance', function () {
      const a = new ObjectId('00000002' + '00'.repeat(8));
      expect(a.id.slice(0, 4)).to.deep.equal(Buffer.from([0, 0, 0, 2]));
      expect(Object.prototype.toString.call(a.getTimestamp())).to.equal('[object Date]');
      expect(a.getTimestamp()).to.deep.equal(new Date(2 * 1000));
      expect(a.getTimestamp().getTime()).to.equal(2000);
    });
  });

  describe('_bsontype casing cross compatibility', () => {
    it('EJSON stringify understands capital or lowercase D _bsontype', () => {
      const resultFromCapitalD = EJSON.stringify(
        { a: new ObjectId('00'.repeat(12)) },
        { relaxed: false }
      );
      const resultFromLowercaseD = EJSON.stringify(
        {
          a: new (class extends ObjectId {
            get _bsontype() {
              return 'ObjectId';
            }
          })('00'.repeat(12))
        },
        { relaxed: false }
      );

      expect(JSON.parse(resultFromCapitalD))
        .to.have.property('a')
        .that.deep.equals({ $oid: '00'.repeat(12) });
      expect(JSON.parse(resultFromLowercaseD))
        .to.have.property('a')
        .that.deep.equals({ $oid: '00'.repeat(12) });
    });

    it('EJSON stringify understands capital or lowercase D _bsontype', () => {
      const resultFromCapitalD = BSON.serialize(
        { a: new ObjectId('00'.repeat(12)) },
        { relaxed: false }
      );
      const resultFromLowercaseD = BSON.serialize(
        {
          a: new (class extends ObjectId {
            get _bsontype() {
              return 'ObjectId';
            }
          })('00'.repeat(12))
        },
        { relaxed: false }
      );

      const expectedBytes = bufferFromHexArray([
        '07', // oid type
        '6100', // 'a\x00'
        '00'.repeat(12) // oid bytes
      ]);

      expect(resultFromCapitalD).to.deep.equal(expectedBytes);
      expect(resultFromLowercaseD).to.deep.equal(expectedBytes);
    });
  });

  it('creates an objectId with user defined value in the timestamp field', function () {
    const a = ObjectId.createFromTime(1);
    expect(a.id.slice(0, 4)).to.deep.equal(Buffer.from([0, 0, 0, 1]));
    expect(a.getTimestamp()).to.deep.equal(new Date(1 * 1000));
    expect(a.getTimestamp().getTime()).to.equal(1000);
  });

  it('should correctly create ObjectId from ObjectId', function () {
    const noArgObjID = new ObjectId();
    expect(new ObjectId(noArgObjID).id).to.deep.equal(Buffer.from(noArgObjID.id, 'hex'));
  });

  const invalidInputs = [
    { input: [], description: 'empty array' },
    { input: ['abcdefŽhijkl'], description: 'nonempty array' },
    { input: {}, description: 'empty object' }
  ];

  for (const { input, description } of invalidInputs) {
    it(`should throw error if ${description} is passed in`, function () {
      expect(() => new ObjectId(input)).to.throw(BSONError);
    });
  }

  it('should throw error if object without an id property is passed in', function () {
    const noArgObjID = new ObjectId();
    const objectIdLike = {
      toHexString: function () {
        return noArgObjID.toHexString();
      }
    };
    expect(() => new ObjectId(objectIdLike)).to.throw(BSONError);
  });

  it('should correctly create ObjectId from object with valid string id', function () {
    const objectValidString24Hex = {
      id: 'aaaaaaaaaaaaaaaaaaaaaaaa'
    };
    const buf24Hex = Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaa', 'hex');
    expect(new ObjectId(objectValidString24Hex).id).to.deep.equal(buf24Hex);
  });

  it('should correctly create ObjectId from object with valid string id and toHexString method', function () {
    function new24HexToHexString() {
      return 'BBBBBBBBBBBBBBBBBBBBBBBB';
    }
    const buf24hex = Buffer.from('BBBBBBBBBBBBBBBBBBBBBBBB', 'hex');
    const objectValidString24Hex = {
      id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      toHexString: new24HexToHexString
    };
    const objectValidString12Bytes = {
      id: 'abcdefghijkl',
      toHexString: new24HexToHexString
    };
    expect(new ObjectId(objectValidString24Hex).id).to.deep.equal(buf24hex);
    expect(new ObjectId(objectValidString12Bytes).id).to.deep.equal(buf24hex);
  });

  it('should correctly create ObjectId from object with valid Buffer id', function () {
    const validBuffer24Hex = Buffer.from('AAAAAAAAAAAAAAAAAAAAAAAA', 'hex');
    const validBuffer12Array = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const objectBufferId = {
      id: validBuffer24Hex
    };
    const objectBufferFromArray = {
      id: validBuffer12Array
    };
    expect(new ObjectId(objectBufferId).id).to.deep.equals(validBuffer24Hex);
    expect(new ObjectId(objectBufferFromArray).id).to.deep.equals(validBuffer12Array);
  });

  it('should correctly create ObjectId from object with valid Buffer id and toHexString method', function () {
    const validBuffer24Hex = Buffer.from('AAAAAAAAAAAAAAAAAAAAAAAA', 'hex');
    const validBuffer12Array = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const bufferNew24Hex = Buffer.from('BBBBBBBBBBBBBBBBBBBBBBBB', 'hex');
    function newToHexString() {
      return 'BBBBBBBBBBBBBBBBBBBBBBBB';
    }
    const objectBufferHex = {
      id: validBuffer24Hex,
      toHexString: newToHexString
    };
    const objectBufferArray = {
      id: validBuffer12Array,
      toHexString: newToHexString
    };
    expect(new ObjectId(objectBufferHex).id).to.deep.equal(bufferNew24Hex);
    expect(new ObjectId(objectBufferArray).id).to.deep.equal(bufferNew24Hex);
  });

  it('should throw error if object with non-Buffer non-string id is passed in', function () {
    const objectNumId = {
      id: 5
    };
    const objectNullId = {
      id: null
    };
    expect(() => new ObjectId(objectNumId)).to.throw(BSONError);
    expect(() => new ObjectId(objectNullId)).to.throw(BSONError);
  });

  it('should throw an error if object with invalid string id is passed in', function () {
    const objectInvalid24HexStr = {
      id: 'FFFFFFFFFFFFFFFFFFFFFFFG'
    };
    expect(() => new ObjectId(objectInvalid24HexStr)).to.throw(BSONError);
  });

  it('should correctly create ObjectId from object with invalid string id and toHexString method', function () {
    function newToHexString() {
      return 'BBBBBBBBBBBBBBBBBBBBBBBB';
    }
    const objectInvalid24HexStr = {
      id: 'FFFFFFFFFFFFFFFFFFFFFFFG',
      toHexString: newToHexString
    };
    const bufferNew24Hex = Buffer.from('BBBBBBBBBBBBBBBBBBBBBBBB', 'hex');
    expect(new ObjectId(objectInvalid24HexStr).id).to.deep.equal(bufferNew24Hex);
  });

  it('should throw an error if object with invalid Buffer id is passed in', function () {
    const objectInvalidBuffer = {
      id: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
    };
    expect(() => new ObjectId(objectInvalidBuffer)).to.throw(BSONError);
  });

  it('should correctly create ObjectId from object with invalid Buffer id and toHexString method', function () {
    function newToHexString() {
      return 'BBBBBBBBBBBBBBBBBBBBBBBB';
    }
    const objectInvalidBuffer = {
      id: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
      toHexString: newToHexString
    };
    const bufferNew24Hex = Buffer.from('BBBBBBBBBBBBBBBBBBBBBBBB', 'hex');
    expect(new ObjectId(objectInvalidBuffer).id).to.deep.equal(bufferNew24Hex);
  });

  const numericIO = [
    { input: 42, output: 42, description: '42' },
    { input: 0x2a, output: 0x2a, description: '0x2a' },
    { input: 4.2, output: 4, description: '4.2' },
    { input: NaN, output: 0, description: 'NaN' }
  ];

  for (const { input, output } of numericIO) {
    it(`should correctly create ObjectId from ${input} and result in ${output}`, function () {
      const objId = new ObjectId(input);
      expect(objId).to.have.property('id');
      expect(
        isBufferOrUint8Array(objId.id),
        `expected objId.id to be instanceof buffer or uint8Array`
      ).to.be.true;
      const num = new DataView(objId.id.buffer, objId.id.byteOffset, objId.id.byteLength).getInt32(
        0,
        false
      );
      expect(num).to.equal(output);
    });
  }

  it('should correctly create ObjectId undefined or null', function () {
    const objNull = new ObjectId(null);
    const objNoArg = new ObjectId();
    const objUndef = new ObjectId(undefined);
    expect(
      isBufferOrUint8Array(objNull.id),
      `expected objNull.id to be instanceof buffer or uint8Array`
    ).to.be.true;
    expect(
      isBufferOrUint8Array(objNoArg.id),
      `expected objNoArg.id to be instanceof buffer or uint8Array`
    ).to.be.true;
    expect(
      isBufferOrUint8Array(objUndef.id),
      `expected objUndef.id to be instanceof buffer or uint8Array`
    ).to.be.true;
  });

  it('should throw error if non-12 byte non-24 hex string passed in', function () {
    expect(() => new ObjectId('FFFFFFFFFFFFFFFFFFFFFFFG')).to.throw(BSONError);
    expect(() => new ObjectId('thisstringisdefinitelytoolong')).to.throw(BSONError);
    expect(() => new ObjectId('tooshort')).to.throw(BSONError);
    expect(() => new ObjectId('101010')).to.throw(BSONError);
    expect(() => new ObjectId('')).to.throw(BSONError);
  });

  it('should correctly create ObjectId from 24 hex string', function () {
    const validStr24Hex = 'FFFFFFFFFFFFFFFFFFFFFFFF';
    expect(new ObjectId(validStr24Hex).id).to.deep.equal(Buffer.from(validStr24Hex, 'hex'));
  });

  it('should fail to create ObjectId from 12 byte sequence', function () {
    const byteSequence12 = '111111111111';
    expect(() => new ObjectId(byteSequence12)).to.throw(BSONError);
  });

  it('should correctly create ObjectId from uppercase hexstring', function (done) {
    let a = 'AAAAAAAAAAAAAAAAAAAAAAAA';
    let b = new ObjectId(a);
    let c = b.equals(a); // => false
    expect(true).to.equal(c);

    a = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    b = new ObjectId(a);
    c = b.equals(a); // => true
    expect(true).to.equal(c);
    expect(a).to.equal(b.toString());

    done();
  });

  it('should correctly create ObjectId from valid Buffer', function (done) {
    if (!Buffer.from) return done();
    let a = 'AAAAAAAAAAAAAAAAAAAAAAAA';
    let b = new ObjectId(Buffer.from(a, 'hex'));
    let c = b.equals(a); // => false
    expect(true).to.equal(c);

    a = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    b = new ObjectId(Buffer.from(a, 'hex'));
    c = b.equals(a); // => true
    expect(a).to.equal(b.toString());
    expect(true).to.equal(c);
    done();
  });

  it('should throw an error if invalid Buffer passed in', function () {
    const a = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(() => new ObjectId(a)).to.throw(BSONError);
  });

  it('should correctly allow for node.js inspect to work with ObjectId', function (done) {
    const a = 'AAAAAAAAAAAAAAAAAAAAAAAA';
    const b = new ObjectId(a);
    expect(util.inspect(b)).to.equal('new ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa")');

    done();
  });

  it('should isValid check input Buffer length', function (done) {
    const buffTooShort = Buffer.from([]);
    const buffTooLong = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    const buff12Bytes = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    expect(ObjectId.isValid(buffTooShort)).to.be.false;
    expect(ObjectId.isValid(buffTooLong)).to.be.false;
    expect(ObjectId.isValid(buff12Bytes)).to.be.true;
    done();
  });

  it('should have isValid be false for 12-char length and 12-byte length string', function () {
    const plainASCIIstr = 'aaaaaaaaaaaa';
    expect(ObjectId.isValid(plainASCIIstr)).to.be.false;
  });

  it('should have isValid be false for 12-char length but non-12-byte length string', function () {
    const characterCodesLargerThan256 = 'abcdefŽhijkl';
    const length12Not12Bytest1 = '🐶🐶🐶🐶🐶🐶';
    const length12Not12Bytest2 = 'value with é';
    expect(ObjectId.isValid(characterCodesLargerThan256)).to.be.false;
    expect(ObjectId.isValid(length12Not12Bytest1)).to.be.false;
    expect(ObjectId.isValid(length12Not12Bytest2)).to.be.false;
  });

  it('should correctly interpret timestamps beyond 2038', function () {
    const farFuture = new Date('2040-01-01T00:00:00.000Z').getTime();
    expect(
      new BSON.ObjectId(BSON.ObjectId.generate(farFuture / 1000)).getTimestamp().getTime()
    ).to.equal(farFuture);
  });

  describe('.equals(otherId)', () => {
    /*
     * ObjectId.equals() covers many varieties of cases passed into it In an attempt to handle ObjectId-like objects
     * Each test covers a corresponding if stmt in the equals method.
     */
    const oidString = '6b61666665656b6c61746368';
    const oid = new ObjectId(oidString);
    const oidKId = getSymbolFrom(oid, 'id');
    it('should return false for an undefined otherId', () => {
      // otherId === undefined || otherId === null
      expect(oid.equals(null)).to.be.false;
      expect(oid.equals(undefined)).to.be.false;
      expect(oid.equals()).to.be.false;
    });

    it('should return true for another ObjectId with the same bytes', () => {
      // otherId instanceof ObjectId
      const equalOid = new ObjectId(oid.id);
      expect(oid.equals(equalOid)).to.be.true;
    });

    it('should return true if otherId is a valid 24 char hex string', () => {
      // typeof otherId === 'string' && ObjectId.isValid(otherId) && otherId.length === 24
      const equalOid = oidString;
      expect(oid.equals(equalOid)).to.be.true;
    });

    it('should return true if otherId is an object with a toHexString function, regardless of casing', () => {
      /*
      typeof otherId === 'object' &&
      'toHexString' in otherId &&
      typeof otherId.toHexString === 'function'
      */
      expect(oid.equals({ toHexString: () => oidString.toLowerCase() })).to.be.true;
      expect(oid.equals({ toHexString: () => oidString.toUpperCase() })).to.be.true;
    });

    it('should return false if toHexString does not return a string', () => {
      // typeof otherIdString === 'string'

      // Now that we call toLowerCase() make sure we guard the call with a type check
      expect(() => oid.equals({ toHexString: () => 100 })).to.not.throw(TypeError);
      expect(oid.equals({ toHexString: () => 100 })).to.be.false;
    });

    it('should not rely on toString for otherIds that are instanceof ObjectId', () => {
      // Note: the method access the symbol prop directly instead of the getter
      const equalId = { toString: () => oidString + 'wrong', [oidKId]: oid.id };
      Object.setPrototypeOf(equalId, ObjectId.prototype);
      expect(oid.toString()).to.not.equal(equalId.toString());
      expect(oid.equals(equalId)).to.be.true;
    });

    it('should use otherId[kId] Buffer for equality when otherId has _bsontype === ObjectId', () => {
      let equalId = { _bsontype: 'ObjectId', [oidKId]: oid.id };

      const propAccessRecord: string[] = [];
      equalId = new Proxy(equalId, {
        get(target, prop: string, recv) {
          if (prop !== '_bsontype') {
            propAccessRecord.push(prop);
          }
          return Reflect.get(target, prop, recv);
        }
      });

      expect(oid.equals(equalId)).to.be.true;
      // once for the 11th byte shortcut
      // once for the total equality
      expect(propAccessRecord).to.deep.equal([oidKId, oidKId]);
    });
  });

  it('should return the same instance if a buffer is passed in', function () {
    const inBuffer = Buffer.from('00'.repeat(12), 'hex');

    const outBuffer = new ObjectId(inBuffer);

    // instance equality
    expect(inBuffer).to.equal(outBuffer.id);
    // deep equality
    expect(inBuffer).to.deep.equal(outBuffer.id);
    // class method equality
    expect(Buffer.prototype.equals.call(inBuffer, outBuffer.id)).to.be.true;
  });

  context('createFromHexString()', () => {
    context('when called with a hex sequence', () => {
      it('returns a ObjectId instance with the decoded bytes', () => {
        const bytes = Buffer.from('0'.repeat(24), 'hex');
        const binary = ObjectId.createFromHexString(bytes.toString('hex'));
        expect(binary).to.have.deep.property('id', bytes);
      });
    });

    context('when called with an incorrect length string', () => {
      it('throws an error indicating the expected length of 24', () => {
        expect(() => ObjectId.createFromHexString('')).to.throw(/24/);
      });
    });
  });

  context('createFromBase64()', () => {
    context('when called with a base64 sequence', () => {
      it('returns a ObjectId instance with the decoded bytes', () => {
        const bytes = Buffer.from('A'.repeat(16), 'base64');
        const binary = ObjectId.createFromBase64(bytes.toString('base64'));
        expect(binary).to.have.deep.property('id', bytes);
      });
    });

    context('when called with an incorrect length string', () => {
      it('throws an error indicating the expected length of 16', () => {
        expect(() => ObjectId.createFromBase64('')).to.throw(/16/);
      });
    });
  });
});
