'use strict';

const {
  Binary,
  Code,
  DBRef,
  Decimal128,
  Double,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  BSONRegExp,
  BSONSymbol,
  Timestamp,
  UUID,
  bsonType
} = require('../register-bson');

describe('_bsontype identifier', () => {
  it('should be equal to ObjectId for ObjectId', () => {
    expect(ObjectId.prototype._bsontype).to.equal('ObjectId');
    expect(ObjectId.prototype[bsonType]).to.equal('ObjectId');
  });
  it('should be equal to BSONSymbol for BSONSymbol', () => {
    expect(BSONSymbol.prototype._bsontype).to.equal('BSONSymbol');
    expect(BSONSymbol.prototype[bsonType]).to.equal('BSONSymbol');
  });
  it('should be equal to Timestamp for Timestamp', () => {
    // TODO(NODE-2624): Make Timestamp hold its long value on a property rather than be a subclass
    // Timestamp overrides the value in its constructor
    const timestamp = new Timestamp({ i: 0, t: 0 });
    expect(timestamp._bsontype).to.equal('Timestamp');
    expect(Object.getPrototypeOf(Object.getPrototypeOf(timestamp))._bsontype).to.equal('Long');
    expect(timestamp[bsonType]).to.equal('Timestamp');
    expect(Object.getPrototypeOf(Object.getPrototypeOf(timestamp))[bsonType]).to.equal('Long');
  });

  // All equal to their constructor names
  it('should be equal to Binary for Binary', () => {
    expect(Binary.prototype._bsontype).to.equal('Binary');
    expect(Binary.prototype[bsonType]).to.equal('Binary');
  });
  it('should be equal to Code for Code', () => {
    expect(Code.prototype._bsontype).to.equal('Code');
    expect(Code.prototype[bsonType]).to.equal('Code');
  });
  it('should be equal to DBRef for DBRef', () => {
    expect(DBRef.prototype._bsontype).to.equal('DBRef');
    expect(DBRef.prototype[bsonType]).to.equal('DBRef');
  });
  it('should be equal to Decimal128 for Decimal128', () => {
    expect(Decimal128.prototype._bsontype).to.equal('Decimal128');
    expect(Decimal128.prototype[bsonType]).to.equal('Decimal128');
  });
  it('should be equal to Double for Double', () => {
    expect(Double.prototype._bsontype).to.equal('Double');
    expect(Double.prototype[bsonType]).to.equal('Double');
  });
  it('should be equal to Int32 for Int32', () => {
    expect(Int32.prototype._bsontype).to.equal('Int32');
    expect(Int32.prototype[bsonType]).to.equal('Int32');
  });
  it('should be equal to Long for Long', () => {
    expect(Long.prototype._bsontype).to.equal('Long');
    expect(Long.prototype[bsonType]).to.equal('Long');
  });
  it('should be equal to MaxKey for MaxKey', () => {
    expect(MaxKey.prototype._bsontype).to.equal('MaxKey');
    expect(MaxKey.prototype[bsonType]).to.equal('MaxKey');
  });
  it('should be equal to MinKey for MinKey', () => {
    expect(MinKey.prototype._bsontype).to.equal('MinKey');
    expect(MinKey.prototype[bsonType]).to.equal('MinKey');
  });
  it('should be equal to BSONRegExp for BSONRegExp', () => {
    expect(BSONRegExp.prototype._bsontype).to.equal('BSONRegExp');
    expect(BSONRegExp.prototype[bsonType]).to.equal('BSONRegExp');
  });
  it('should be equal to Binary for UUID', () => {
    expect(UUID.prototype._bsontype).to.equal('Binary');
    expect(UUID.prototype[bsonType]).to.equal('Binary');
  });
});
