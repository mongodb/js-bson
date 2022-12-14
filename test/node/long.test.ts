import { Long } from '../register-bson';

describe('Long', function () {
  it('accepts strings in the constructor', function () {
    expect(new Long('0').toString()).to.equal('0');
    expect(new Long('00').toString()).to.equal('0');
    expect(new Long('-1').toString()).to.equal('-1');
    expect(new Long('-1', true).toString()).to.equal('18446744073709551615');
    expect(new Long('123456789123456789').toString()).to.equal('123456789123456789');
    expect(new Long('123456789123456789', true).toString()).to.equal('123456789123456789');
    expect(new Long('13835058055282163712').toString()).to.equal('-4611686018427387904');
    expect(new Long('13835058055282163712', true).toString()).to.equal('13835058055282163712');
  });

  it('Accept BigInts in Long constructor', function () {
    expect(new Long(0n).toString()).to.equal('0');
    expect(new Long(-1n).toString()).to.equal('-1');
    expect(new Long(-1n, true).toString()).to.equal('18446744073709551615');
    expect(new Long(123456789123456789n).toString()).to.equal('123456789123456789');
    expect(new Long(123456789123456789n, true).toString()).to.equal('123456789123456789');
    expect(new Long(13835058055282163712n).toString()).to.equal('-4611686018427387904');
    expect(new Long(13835058055282163712n, true).toString()).to.equal('13835058055282163712');
  });
});
