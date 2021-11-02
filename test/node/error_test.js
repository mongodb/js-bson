'use strict';

const BSON = require('../register-bson');
const BSONTypeError = BSON.BSONTypeError;
const BSONError = BSON.BSONError;

describe('BSON error tests', function () {
  it('should correctly validate instanceof checks for BSONTypeError and BSONError', function () {
    const bsonTypeErr = new BSONTypeError();
    const bsonErr = new BSONError();

    expect(bsonTypeErr).to.be.instanceOf(BSONTypeError);
    expect(bsonTypeErr).to.be.instanceOf(TypeError);
    expect(bsonErr).to.be.instanceOf(BSONError);
    expect(bsonErr).to.be.instanceOf(Error);
  });

  it('should correctly get correct names for BSONTypeError and BSONError', function () {
    const bsonTypeErr = new BSONTypeError('This is a BSONTypeError message');
    const bsonErr = new BSONError('This is a BSONError message');

    expect(bsonTypeErr.name).equals('BSONTypeError');
    expect(bsonTypeErr.message).equals('This is a BSONTypeError message');
    expect(bsonErr.name).equals('BSONError');
    expect(bsonErr.message).equals('This is a BSONError message');
  });
});
