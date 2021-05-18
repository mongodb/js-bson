'use strict';

const BSON = require('../register-bson');
const Long = BSON.Long;

describe('Long', function () {
  it('accepts strings in the constructor', function (done) {
    expect(new Long('0').toString()).to.equal('0');
    expect(new Long('00').toString()).to.equal('0');
    expect(new Long('-1').toString()).to.equal('-1');
    expect(new Long('-1', true).toString()).to.equal('18446744073709551615');
    expect(new Long('123456789123456789').toString()).to.equal('123456789123456789');
    expect(new Long('123456789123456789', true).toString()).to.equal('123456789123456789');
    expect(new Long('13835058055282163712').toString()).to.equal('-4611686018427387904');
    expect(new Long('13835058055282163712', true).toString()).to.equal('13835058055282163712');
    done();
  });
});
