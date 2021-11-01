'use strict';
const Buffer = require('buffer').Buffer;
const BSON = require('../register-bson');
const util = require('util');
const ObjectId = BSON.ObjectId;

describe('ObjectId', function () {
  /**
   * @ignore
   */

  it('should correctly handle objectId timestamps', function (done) {
    // var test_number = {id: ObjectI()};
    var a = ObjectId.createFromTime(1);
    expect(Buffer.from([0, 0, 0, 1])).to.deep.equal(a.id.slice(0, 4));
    expect(1000).to.equal(a.getTimestamp().getTime());

    var b = new ObjectId();
    b.generationTime = 1;
    expect(Buffer.from([0, 0, 0, 1])).to.deep.equal(b.id.slice(0, 4));
    expect(1).to.equal(b.generationTime);
    expect(1000).to.equal(b.getTimestamp().getTime());

    done();
  });

  it('should correctly create ObjectId from ObjectId', function () {
    var tmp = new ObjectId();
    expect(new ObjectId(tmp).id.equals(Buffer.from(tmp.id, 'hex')));
  });

  const invalidInputs = [
    {input: [], description: 'empty array'},
    {input: ['abcdefŽhijkl'], description: 'nonempty array'},
    {input: {}, description: 'empty object'}
  ]

  for (const {input, description} of invalidInputs) {
    it(`should throw error if ${description} is passed in`, function () {
      expect(() => new ObjectId(input)).to.throw(TypeError);
    });
  }

  it('should throw error if object without an id property is passed in', function () {
    var tmp = new ObjectId();
    var objectIdLike = {
      toHexString: function () {
        return tmp.toHexString();
      }
    };

    expect(() => new ObjectId(objectIdLike)).to.throw(TypeError);
  });

  it('should correctly create ObjectId from object with valid string id', function () {
    var objectValidStringId1 = {
      id: 'aaaaaaaaaaaaaaaaaaaaaaaa'
    };
    var objectValidStringId2 = {
      id: 'abcdefghijkl'
    };
    var buf1 = Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaa', 'hex');
    var buf2 = Buffer.from('abcdefghijkl', 'hex');
    expect(Buffer.from(new ObjectId(objectValidStringId1).id).equals(buf1));
    expect(Buffer.from(new ObjectId(objectValidStringId2).id).equals(buf2));
  });

  it('should correctly create ObjectId from object with valid string id and toHexString method', function () {
    function newToHexString() {
      return 'BBBBBBBBBBBBBBBBBBBBBBBB';
    }
    var buf = Buffer.from('BBBBBBBBBBBBBBBBBBBBBBBB', 'hex');
    var objectValidStringId1 = {
      id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      toHexString: newToHexString
    };
    var objectValidStringId2 = {
      id: 'abcdefghijkl',
      toHexString: newToHexString
    };
    expect(Buffer.from(new ObjectId(objectValidStringId1).id).equals(buf));
    expect(Buffer.from(new ObjectId(objectValidStringId2).id).equals(buf));
  });

  it('should correctly create ObjectId from object with valid Buffer id', function () {
    var validBuffer1 = Buffer.from('AAAAAAAAAAAAAAAAAAAAAAAA', 'hex');
    var validBuffer2 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    var objectBufferId = {
      id: validBuffer1
    };
    var objectBufferFromArray = {
      id: validBuffer2
    };
    expect(Buffer.from(new ObjectId(objectBufferId).id).equals(validBuffer1));
    expect(Buffer.from(new ObjectId(objectBufferFromArray).id).equals(validBuffer2));
  });

  it('should correctly create ObjectId from object with valid Buffer id and toHexString method', function () {
    var validBuffer1 = Buffer.from('AAAAAAAAAAAAAAAAAAAAAAAA', 'hex');
    var validBuffer2 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    var bufferToHex = Buffer.from('BBBBBBBBBBBBBBBBBBBBBBBB', 'hex');
    function newToHexString() {
      return 'BBBBBBBBBBBBBBBBBBBBBBBB';
    }
    var objectBufferId = {
      id: validBuffer1,
      toHexString: newToHexString
    };
    var objectBufferFromArray = {
      id: validBuffer2,
      toHexString: newToHexString
    };
    expect(Buffer.from(new ObjectId(objectBufferId).id).equals(bufferToHex));
    expect(Buffer.from(new ObjectId(objectBufferFromArray).id).equals(bufferToHex));
  });

  it('should throw error if object with non-Buffer non-string id is passed in', function () {
    var objectNumId = {
      id: 5
    };
    var objectNullId = {
      id: null
    };
    expect(() => new ObjectId(objectNumId)).to.throw(TypeError);
    expect(() => new ObjectId(objectNullId)).to.throw(TypeError);
  });

  it('should throw an error if object with invalid string id is passed in', function () {
    var objectInvalidString = {
      id: 'FFFFFFFFFFFFFFFFFFFFFFFG'
    };
    expect(() => new ObjectId(objectInvalidString)).to.throw(TypeError);
  });

  it('should correctly create ObjectId from object with invalid string id and toHexString method', function () {
    function newToHexString() {
      return 'BBBBBBBBBBBBBBBBBBBBBBBB';
    }
    var objectInvalidString = {
      id: 'FFFFFFFFFFFFFFFFFFFFFFFG',
      toHexString: newToHexString
    };
    var buf = Buffer.from('BBBBBBBBBBBBBBBBBBBBBBBB', 'hex');
    expect(Buffer.from(new ObjectId(objectInvalidString).id).equals(buf));
  });

  it('should throw an error if object with invalid Buffer id is passed in', function () {
    var objectInvalidBuffer = {
      id: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
    };
    expect(() => new ObjectId(objectInvalidBuffer)).to.throw(TypeError);
  });

  it('should correctly create ObjectId from object with invalid Buffer id and toHexString method', function () {
    function newToHexString() {
      return 'BBBBBBBBBBBBBBBBBBBBBBBB';
    }
    var objectInvalidBuffer = {
      id: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
      toHexString: newToHexString
    };
    var buf = Buffer.from('BBBBBBBBBBBBBBBBBBBBBBBB', 'hex');
    expect(Buffer.from(new ObjectId(objectInvalidBuffer).id).equals(buf));
  });

  const numericIO = [
    {input: 42, output: 42},
    {input: 0x2a, output: 0x2a},
    {input: 4.2, output: 4},
    {input: NaN, output: 0}
  ]

  for (const {input, output} of numericIO) {
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
    expect(() => new ObjectId('FFFFFFFFFFFFFFFFFFFFFFFG')).to.throw(TypeError);
    expect(() => new ObjectId('thisstringisdefinitelytoolong')).to.throw(TypeError);
    expect(() => new ObjectId('tooshort')).to.throw(TypeError);
    expect(() => new ObjectId('101010')).to.throw(TypeError);
    expect(() => new ObjectId('')).to.throw(TypeError);
  });

  it('should correctly create ObjectId from 12 byte or 24 hex string', function () {
    var str1 = 'AAAAAAAAAAAAAAAAAAAAAAAA';
    var str2 = 'FFFFFFFFFFFFFFFFFFFFFFFF';
    var str3 = 'abcdefghijkl';
    expect(new ObjectId(str1).id.equals(Buffer.from(str1, 'hex')));
    expect(new ObjectId(str2).id.equals(Buffer.from(str2, 'hex')));
    expect(new ObjectId(str3).id.equals(Buffer.from(str3, 'hex')));
  });

  it('should correctly create ObjectId from 12 byte sequence', function () {
    var a = '111111111111';
    expect(Buffer.from(new ObjectId(a).id).equals(Buffer.from(a, 'latin1')));
  });

  /**
   * @ignore
   */
  it('should correctly create ObjectId from uppercase hexstring', function (done) {
    var a = 'AAAAAAAAAAAAAAAAAAAAAAAA';
    var b = new ObjectId(a);
    var c = b.equals(a); // => false
    expect(true).to.equal(c);

    a = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    b = new ObjectId(a);
    c = b.equals(a); // => true
    expect(true).to.equal(c);
    expect(a).to.equal(b.toString());

    done();
  });

  /**
   * @ignore
   */
  it('should correctly create ObjectId from valid Buffer', function (done) {
    if (!Buffer.from) return done();
    var a = 'AAAAAAAAAAAAAAAAAAAAAAAA';
    var b = new ObjectId(Buffer.from(a, 'hex'));
    var c = b.equals(a); // => false
    expect(true).to.equal(c);

    a = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    b = new ObjectId(Buffer.from(a, 'hex'));
    c = b.equals(a); // => true
    expect(a).to.equal(b.toString());
    expect(true).to.equal(c);
    done();
  });

  it('should throw an error if invalid Buffer passed in', function () {
    var a = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(() => new ObjectId(a)).to.throw(TypeError);
  });

  /**
   * @ignore
   */
  it('should correctly allow for node.js inspect to work with ObjectId', function (done) {
    var a = 'AAAAAAAAAAAAAAAAAAAAAAAA';
    var b = new ObjectId(a);
    expect(util.inspect(b)).to.equal('new ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa")');

    done();
  });

  /**
   * @ignore
   */
  it('should isValid check input Buffer length', function (done) {
    var buffTooShort = Buffer.from([]);
    var buffTooLong = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    var buff12Bytes = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    expect(ObjectId.isValid(buffTooShort)).to.be.false;
    expect(ObjectId.isValid(buffTooLong)).to.be.false;
    expect(ObjectId.isValid(buff12Bytes)).to.be.true;
    done();
  });

  it('should throw if a 12-char string is passed in with character codes greater than 256', function () {
    expect(() => new ObjectId('abcdefghijkl').toHexString()).to.not.throw();
    expect(() => new ObjectId('abcdefŽhijkl').toHexString()).to.throw(TypeError);
  });

  it('should correctly interpret timestamps beyond 2038', function () {
    var farFuture = new Date('2040-01-01T00:00:00.000Z').getTime();
    expect(
      new BSON.ObjectId(BSON.ObjectId.generate(farFuture / 1000)).getTimestamp().getTime()
    ).to.equal(farFuture);
  });
});
