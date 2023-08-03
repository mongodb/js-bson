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
  UUID
} = require('../register-bson');

describe('_bsontype identifier', () => {
  it('should be equal to ObjectId for ObjectId', () => {
    expect(ObjectId.prototype._bsontype).to.equal('ObjectId');
  });
  it('should be equal to BSONSymbol for BSONSymbol', () => {
    expect(BSONSymbol.prototype._bsontype).to.equal('BSONSymbol');
  });
  it('should be equal to Timestamp for Timestamp', () => {
    const timestamp = new Timestamp({ i: 0, t: 0 });
    expect(timestamp._bsontype).to.equal('Timestamp');
  });

  // All equal to their constructor names
  it('should be equal to Binary for Binary', () => {
    expect(Binary.prototype._bsontype).to.equal('Binary');
  });
  it('should be equal to Code for Code', () => {
    expect(Code.prototype._bsontype).to.equal('Code');
  });
  it('should be equal to DBRef for DBRef', () => {
    expect(DBRef.prototype._bsontype).to.equal('DBRef');
  });
  it('should be equal to Decimal128 for Decimal128', () => {
    expect(Decimal128.prototype._bsontype).to.equal('Decimal128');
  });
  it('should be equal to Double for Double', () => {
    expect(Double.prototype._bsontype).to.equal('Double');
  });
  it('should be equal to Int32 for Int32', () => {
    expect(Int32.prototype._bsontype).to.equal('Int32');
  });
  it('should be equal to Long for Long', () => {
    expect(Long.prototype._bsontype).to.equal('Long');
  });
  it('should be equal to MaxKey for MaxKey', () => {
    expect(MaxKey.prototype._bsontype).to.equal('MaxKey');
  });
  it('should be equal to MinKey for MinKey', () => {
    expect(MinKey.prototype._bsontype).to.equal('MinKey');
  });
  it('should be equal to BSONRegExp for BSONRegExp', () => {
    expect(BSONRegExp.prototype._bsontype).to.equal('BSONRegExp');
  });
  it('should be equal to Binary for UUID', () => {
    expect(UUID.prototype._bsontype).to.equal('Binary');
  });
});
