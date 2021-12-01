'use strict';

const Buffer = require('buffer').Buffer;
const BSON = require('../register-bson');
const BSONTypeError = BSON.BSONTypeError;
const util = require('util');
const ObjectId = BSON.ObjectId;

describe('ObjectId', function () {
  it('should correctly handle objectId timestamps', function (done) {
    const a = ObjectId.createFromTime(1);
    expect(Buffer.from([0, 0, 0, 1])).to.deep.equal(a.id.slice(0, 4));
    expect(1000).to.equal(a.getTimestamp().getTime());

    const b = new ObjectId();
    b.generationTime = 1;
    expect(Buffer.from([0, 0, 0, 1])).to.deep.equal(b.id.slice(0, 4));
    expect(1).to.equal(b.generationTime);
    expect(1000).to.equal(b.getTimestamp().getTime());

    done();
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
      expect(() => new ObjectId(input)).to.throw(BSONTypeError);
    });
  }

  it('should throw error if object without an id property is passed in', function () {
    const noArgObjID = new ObjectId();
    const objectIdLike = {
      toHexString: function () {
        return noArgObjID.toHexString();
      }
    };
    expect(() => new ObjectId(objectIdLike)).to.throw(BSONTypeError);
  });

  it('should correctly create ObjectId from object with valid string id', function () {
    const objectValidString24Hex = {
      id: 'aaaaaaaaaaaaaaaaaaaaaaaa'
    };
    const objectValidString12Bytes = {
      id: 'abcdefghijkl'
    };
    const buf24Hex = Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaa', 'hex');
    const buf12Bytes = Buffer.from('abcdefghijkl');
    expect(new ObjectId(objectValidString24Hex).id).to.deep.equal(buf24Hex);
    expect(new ObjectId(objectValidString12Bytes).id).to.deep.equal(buf12Bytes);
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
    expect(() => new ObjectId(objectNumId)).to.throw(BSONTypeError);
    expect(() => new ObjectId(objectNullId)).to.throw(BSONTypeError);
  });

  it('should throw an error if object with invalid string id is passed in', function () {
    const objectInvalid24HexStr = {
      id: 'FFFFFFFFFFFFFFFFFFFFFFFG'
    };
    expect(() => new ObjectId(objectInvalid24HexStr)).to.throw(BSONTypeError);
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
    expect(() => new ObjectId(objectInvalidBuffer)).to.throw(BSONTypeError);
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
      expect(objId.id).to.be.instanceOf(Buffer);
      expect(objId.id.readUInt32BE(0)).to.equal(output);
    });
  }

  it('should correctly create ObjectId undefined or null', function () {
    const objNull = new ObjectId(null);
    const objNoArg = new ObjectId();
    const objUndef = new ObjectId(undefined);
    expect(objNull.id).to.be.instanceOf(Buffer);
    expect(objNoArg.id).to.be.instanceOf(Buffer);
    expect(objUndef.id).to.be.instanceOf(Buffer);
  });

  it('should throw error if non-12 byte non-24 hex string passed in', function () {
    expect(() => new ObjectId('FFFFFFFFFFFFFFFFFFFFFFFG')).to.throw(BSONTypeError);
    expect(() => new ObjectId('thisstringisdefinitelytoolong')).to.throw(BSONTypeError);
    expect(() => new ObjectId('tooshort')).to.throw(BSONTypeError);
    expect(() => new ObjectId('101010')).to.throw(BSONTypeError);
    expect(() => new ObjectId('')).to.throw(BSONTypeError);
  });

  it('should correctly create ObjectId from 24 hex string', function () {
    const validStr24Hex = 'FFFFFFFFFFFFFFFFFFFFFFFF';
    expect(new ObjectId(validStr24Hex).id).to.deep.equal(Buffer.from(validStr24Hex, 'hex'));
  });

  it('should correctly create ObjectId from 12 byte sequence', function () {
    const byteSequence12 = '111111111111';
    expect(new ObjectId(byteSequence12).id).to.deep.equal(Buffer.from(byteSequence12, 'latin1'));
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
    expect(() => new ObjectId(a)).to.throw(BSONTypeError);
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

  it('should throw if a 12-char length but non-12 byte string is passed in', function () {
    const characterCodesLargerThan256 = 'abcdefŽhijkl';
    const length12Not12Bytes = '🐶🐶🐶🐶🐶🐶';
    expect(() => new ObjectId(characterCodesLargerThan256).toHexString()).to.throw(
      BSONTypeError,
      'Argument passed in must be a string of 12 bytes'
    );
    expect(() => new ObjectId(length12Not12Bytes).id).to.throw(
      BSONTypeError,
      'Argument passed in must be a string of 12 bytes'
    );
  });

  it('should have isValid be true for 12-char length and 12-byte length string', function () {
    const plainASCIIstr = 'aaaaaaaaaaaa';
    expect(ObjectId.isValid(plainASCIIstr)).to.be.true;
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
});
