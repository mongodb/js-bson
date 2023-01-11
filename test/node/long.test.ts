import { expect } from 'chai';
import { Long, BSONError } from '../register-bson';

describe('Long', function() {
  it('accepts strings in the constructor', function() {
    expect(new Long('0').toString()).to.equal('0');
    expect(new Long('00').toString()).to.equal('0');
    expect(new Long('-1').toString()).to.equal('-1');
    expect(new Long('-1', true).toString()).to.equal('18446744073709551615');
    expect(new Long('123456789123456789').toString()).to.equal('123456789123456789');
    expect(new Long('123456789123456789', true).toString()).to.equal('123456789123456789');
    expect(new Long('13835058055282163712').toString()).to.equal('-4611686018427387904');
    expect(new Long('13835058055282163712', true).toString()).to.equal('13835058055282163712');
  });

  it('accepts BigInts in Long constructor', function() {
    expect(new Long(0n).toString()).to.equal('0');
    expect(new Long(-1n).toString()).to.equal('-1');
    expect(new Long(-1n, true).toString()).to.equal('18446744073709551615');
    expect(new Long(123456789123456789n).toString()).to.equal('123456789123456789');
    expect(new Long(123456789123456789n, true).toString()).to.equal('123456789123456789');
    expect(new Long(13835058055282163712n).toString()).to.equal('-4611686018427387904');
    expect(new Long(13835058055282163712n, true).toString()).to.equal('13835058055282163712');
  });

  describe('static fromExtendedJSON()', function() {
    it('is not affected by the legacy flag', function() {
      const ejsonDoc = { $numberLong: '123456789123456789' };
      const longRelaxedLegacy = Long.fromExtendedJSON(ejsonDoc, { legacy: true, relaxed: true });
      const longRelaxedNonLegacy = Long.fromExtendedJSON(ejsonDoc, {
        legacy: false,
        relaxed: true
      });
      const longCanonicalLegacy = Long.fromExtendedJSON(ejsonDoc, { legacy: true, relaxed: false });
      const longCanonicalNonLegacy = Long.fromExtendedJSON(ejsonDoc, {
        legacy: false,
        relaxed: false
      });

      expect(longRelaxedLegacy).to.deep.equal(longRelaxedNonLegacy);
      expect(longCanonicalLegacy).to.deep.equal(longCanonicalNonLegacy);
    });

    describe('rejects with BSONError', function() {
      it('hex strings', function() {
        expect(() => {
          const ejsonDoc = { $numberLong: '0xffffffff' };
          return Long.fromExtendedJSON(ejsonDoc);
        }).to.throw(BSONError);
      });
      it('octal strings', function() {
        expect(() => {
          const ejsonDoc = { $numberLong: '0o1234567' };
          return Long.fromExtendedJSON(ejsonDoc);
        }).to.throw(BSONError);
      });
      it('strings longer than 22 characters', function() {
        expect(() => {
          const ejsonDoc = { $numberLong: '99999999999999999999999' }
          return Long.fromExtendedJSON(ejsonDoc);
        }).to.throw(BSONError);
      });
      it('strings with leading zeros', function() {
        expect(() => {
          const ejsonDoc = { $numberLong: '000123456' }
          return Long.fromExtendedJSON(ejsonDoc);
        }).to.throw(BSONError);
      });
      it('non-numeric strings', function() {
        expect(() => {
          const ejsonDoc = { $numberLong: 'hello world' }
          return Long.fromExtendedJSON(ejsonDoc);
        }).to.throw(BSONError);
      })
      it('strings encoding numbers larger than 64 bits wide when useBigInt64 is true', function() {
        expect(() => {
          const ejsonDoc = { $numberLong: 0xf_ffff_ffff_ffff_ffffn.toString() }
          return Long.fromExtendedJSON(ejsonDoc, {useBigInt64: true});
        }).to.throw(BSONError);
      });
    });
  });
});
