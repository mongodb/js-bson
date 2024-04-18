import { expect } from 'chai';
import { Long, BSONError, __noBigInt__ } from '../register-bson';

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

  it('accepts BigInts in Long constructor', function () {
    if (__noBigInt__) {
      this.currentTest?.skip();
    }
    expect(new Long(0n).toString()).to.equal('0');
    expect(new Long(-1n).toString()).to.equal('-1');
    expect(new Long(-1n, true).toString()).to.equal('18446744073709551615');
    expect(new Long(123456789123456789n).toString()).to.equal('123456789123456789');
    expect(new Long(123456789123456789n, true).toString()).to.equal('123456789123456789');
    expect(new Long(13835058055282163712n).toString()).to.equal('-4611686018427387904');
    expect(new Long(13835058055282163712n, true).toString()).to.equal('13835058055282163712');
  });

  describe('static fromExtendedJSON()', function () {
    it('is not affected by the legacy flag', function () {
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

    describe('accepts', function () {
      it('+0', function () {
        const ejsonDoc = { $numberLong: '+0' };
        expect(Long.fromExtendedJSON(ejsonDoc, { relaxed: false })).to.deep.equal(
          Long.fromNumber(0)
        );
      });

      it('negative integers within int64 range', function () {
        const ejsonDoc = { $numberLong: '-1235498139' };
        expect(Long.fromExtendedJSON(ejsonDoc, { relaxed: false })).to.deep.equal(
          Long.fromNumber(-1235498139)
        );
      });

      it('positive numbers within int64 range', function () {
        const ejsonDoc = { $numberLong: '1234567129' };
        expect(Long.fromExtendedJSON(ejsonDoc, { relaxed: false })).to.deep.equal(
          Long.fromNumber(1234567129)
        );
      });
    });

    describe('rejects with BSONError', function () {
      it('hex strings', function () {
        const ejsonDoc = { $numberLong: '0xffffffff' };
        expect(() => Long.fromExtendedJSON(ejsonDoc)).to.throw(
          BSONError,
          /is in an invalid format/
        );
      });

      it('octal strings', function () {
        const ejsonDoc = { $numberLong: '0o1234567' };
        expect(() => Long.fromExtendedJSON(ejsonDoc)).to.throw(
          BSONError,
          /is in an invalid format/
        );
      });

      it('binary strings', function () {
        const ejsonDoc = { $numberLong: '0b010101101011' };
        expect(() => Long.fromExtendedJSON(ejsonDoc)).to.throw(
          BSONError,
          /is in an invalid format/
        );
      });

      it('strings longer than 20 characters', function () {
        const ejsonDoc = { $numberLong: '99999999999999999999999' };
        expect(() => Long.fromExtendedJSON(ejsonDoc)).to.throw(BSONError, /is too long/);
      });

      it('strings with leading zeros', function () {
        const ejsonDoc = { $numberLong: '000123456' };
        expect(() => Long.fromExtendedJSON(ejsonDoc)).to.throw(
          BSONError,
          /is in an invalid format/
        );
      });

      it('non-numeric strings', function () {
        const ejsonDoc = { $numberLong: 'hello world' };
        expect(() => Long.fromExtendedJSON(ejsonDoc)).to.throw(
          BSONError,
          /is in an invalid format/
        );
      });

      it('-0', function () {
        const ejsonDoc = { $numberLong: '-0' };
        expect(() => Long.fromExtendedJSON(ejsonDoc)).to.throw(
          BSONError,
          /is in an invalid format/
        );
      });
    });

    describe('when useBigInt64=true', function () {
      beforeEach(function () {
        if (__noBigInt__) {
          this.currentTest?.skip();
        }
      });
      describe('truncates', function () {
        it('positive numbers outside int64 range', function () {
          const ejsonDoc = { $numberLong: '9223372036854775808' }; // 2^63
          expect(Long.fromExtendedJSON(ejsonDoc, { useBigInt64: true })).to.deep.equal(
            -9223372036854775808n
          );
        });

        it('negative numbers outside int64 range', function () {
          const ejsonDoc = { $numberLong: '-9223372036854775809' }; // -2^63 - 1
          expect(Long.fromExtendedJSON(ejsonDoc, { useBigInt64: true })).to.deep.equal(
            9223372036854775807n
          );
        });
      });
    });

    describe('when useBigInt64=false', function () {
      describe('truncates', function () {
        it('positive numbers outside int64 range', function () {
          const ejsonDoc = { $numberLong: '9223372036854775808' }; // 2^63
          expect(
            Long.fromExtendedJSON(ejsonDoc, { useBigInt64: false, relaxed: false })
          ).to.deep.equal(Long.fromString('-9223372036854775808'));
        });

        it('negative numbers outside int64 range', function () {
          const ejsonDoc = { $numberLong: '-9223372036854775809' }; // -2^63 - 1
          expect(
            Long.fromExtendedJSON(ejsonDoc, { useBigInt64: false, relaxed: false })
          ).to.deep.equal(Long.fromString('9223372036854775807'));
        });
      });
    });
  });

  describe.only('static validateString()', function() {
    it('does not accept non-numeric inputs', () => {
      console.log(Long.fromString('foo'));
      console.log(Long.fromString("1234xxx5"));
      console.log(Long.fromString("1234xxxx5"))
      console.log(Long.fromString("1234xxxxx5"));
    });
  });
});
