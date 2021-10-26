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

  it('should throw error if empty array is passed in', function () {
    expect(() => new ObjectId([])).to.throw(TypeError);
  });

  it('should throw error if nonempty array is passed in', function () {
    expect(() => new ObjectId(['abcdefŽhijkl'])).to.throw(TypeError);
  });

  it('should throw error if empty object is passed in', function () {
    expect(() => new ObjectId({})).to.throw(TypeError);
  });

  it('should throw error if object without an id property is passed in', function () {
    var tmp = new ObjectId();
    var objectIdLike = {
      toHexString: function () {
        return tmp.toHexString();
      }
    };

    expect(() => new ObjectId(objectIdLike)).to.throw(TypeError);
  });

  it('should correctly create ObjectId from number', function () {
    expect(() => new ObjectId(42)).to.not.throw();
    expect(() => new ObjectId(0x2a)).to.not.throw();
    expect(() => new ObjectId(NaN)).to.not.throw();
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
  it('should correctly create ObjectId from Buffer', function (done) {
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
