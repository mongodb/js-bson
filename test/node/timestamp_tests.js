'use strict';

const BSON = require('../register-bson');

describe('Timestamp', function () {
  it('should have a MAX_VALUE equal to Long.MAX_UNSIGNED_VALUE', function () {
    expect(BSON.Timestamp.MAX_VALUE).to.equal(BSON.Long.MAX_UNSIGNED_VALUE);
  });

  it('should always be an unsigned value', function () {
    [
      new BSON.Timestamp(),
      new BSON.Timestamp(0xff, 0xffffffff),
      new BSON.Timestamp(0xffffffff, 0xffffffff),
      new BSON.Timestamp(-1, -1),
      new BSON.Timestamp(new BSON.Timestamp(0xffffffff, 0xffffffff)),
      new BSON.Timestamp(new BSON.Long(0xffffffff, 0xfffffffff, false)),
      new BSON.Timestamp(new BSON.Long(0xffffffff, 0xfffffffff, true))
    ].forEach(timestamp => {
      expect(timestamp).to.have.property('unsigned', true);
    });
  });

  it('should print out an unsigned number', function () {
    const timestamp = new BSON.Timestamp(0xffffffff, 0xffffffff);
    expect(timestamp.toString()).to.equal('18446744073709551615');
    expect(timestamp.toJSON()).to.deep.equal({ $timestamp: '18446744073709551615' });
    expect(timestamp.toExtendedJSON()).to.deep.equal({
      $timestamp: { t: 4294967295, i: 4294967295 }
    });
  });
});
