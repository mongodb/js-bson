'use strict';

const { __isWeb__ } = require('../register-bson');
const BSON = require('../register-bson');
const BSONTypeError = BSON.BSONTypeError;
const BSONError = BSON.BSONError;

describe('BSONTypeError', function () {
  it('should evaluate true on instanceof BSONTypeError and TypeError', function () {
    const bsonTypeErr = new BSONTypeError();
    if (__isWeb__) {
      expect(bsonTypeErr).to.have.property('name', 'BSONTypeError');
      expect(Object.getPrototypeOf(BSONTypeError.prototype)).to.have.property('name', 'TypeError');
    } else {
      expect(bsonTypeErr instanceof BSONTypeError).to.be.true;
      expect(bsonTypeErr).to.be.instanceOf(BSONTypeError);
      expect(bsonTypeErr instanceof TypeError).to.be.true;
      expect(bsonTypeErr).to.be.instanceOf(TypeError);
    }
  });

  it('should correctly set BSONTypeError name and message properties', function () {
    const bsonTypeErr = new BSONTypeError('This is a BSONTypeError message');
    expect(bsonTypeErr.name).equals('BSONTypeError');
    expect(bsonTypeErr.message).equals('This is a BSONTypeError message');
  });
});

describe('BSONError', function () {
  it('should evaluate true on instanceof BSONError and Error', function () {
    const bsonErr = new BSONError();
    if (__isWeb__) {
      expect(bsonErr).to.have.property('name', 'BSONError');
      expect(Object.getPrototypeOf(BSONError.prototype)).to.have.property('name', 'Error');
    } else {
      expect(bsonErr instanceof BSONError).to.be.true;
      expect(bsonErr instanceof Error).to.be.true;
      expect(bsonErr).to.be.instanceOf(BSONError);
      expect(bsonErr).to.be.instanceOf(Error);
    }
  });

  it('should correctly set BSONError name and message properties', function () {
    const bsonErr = new BSONError('This is a BSONError message');
    expect(bsonErr.name).equals('BSONError');
    expect(bsonErr.message).equals('This is a BSONError message');
  });
});
