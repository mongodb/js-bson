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

  describe('static fromString()', function () {
    const successInputs: [
      name: string,
      input: string,
      unsigned: boolean | undefined,
      radix: number | undefined,
      expectedStr?: string
    ][] = [
      ['radix 36 Infinity', 'Infinity', false, 36],
      ['radix 36 -Infinity', '-Infinity', false, 36],
      ['radix 36 +Infinity', '+Infinity', false, 36, 'infinity'],
      ['radix < 35 Infinity', 'Infinity', false, 34, '0'],
      ['radix < 35 -Infinity', '-Infinity', false, 23, '0'],
      ['radix < 35 +Infinity', '+Infinity', false, 12, '0'],
      ['radix < 24 NaN', 'NaN', false, 16, '0'],
      ['radix > 24 NaN', 'NaN', false, 25]
    ];

    for (const [testName, str, unsigned, radix, expectedStr] of successInputs) {
      context(`when the input is ${testName}`, () => {
        it(`should return a Long representation of the input`, () => {
          expect(Long.fromString(str, unsigned, radix).toString(radix)).to.equal(
            expectedStr ?? str.toLowerCase()
          );
        });
      });
    }
  });

  describe('static fromStringStrict()', function () {
    const successInputs: [
      name: string,
      input: string,
      unsigned: boolean | undefined,
      radix: number | undefined,
      expectedStr?: string
    ][] = [
      ['basic no alphabet low radix', '1236', true, 8],
      ['negative basic no alphabet low radix', '-1236', false, 8],
      ['valid upper and lower case letters in string with radix > 10', 'eEe', true, 15],
      ['hexadecimal letters', '126073efbcdADEF', true, 16],
      ['negative hexadecimal letters', '-1267efbcdDEF', false, 16],
      ['negative leading zeros', '-00000032', false, 15, '-32'],
      ['leading zeros', '00000032', false, 15, '32'],
      ['explicit positive leading zeros', '+00000032', false, 15, '32'],
      ['max unsigned binary input', Long.MAX_UNSIGNED_VALUE.toString(2), true, 2],
      ['max unsigned decimal input', Long.MAX_UNSIGNED_VALUE.toString(10), true, 10],
      ['max unsigned hex input', Long.MAX_UNSIGNED_VALUE.toString(16), true, 16],
      ['max signed binary input', Long.MAX_VALUE.toString(2), false, 2],
      ['max signed decimal input', Long.MAX_VALUE.toString(10), false, 10],
      ['max signed hex input', Long.MAX_VALUE.toString(16), false, 16],
      ['min signed binary input', Long.MIN_VALUE.toString(2), false, 2],
      ['min signed decimal input', Long.MIN_VALUE.toString(10), false, 10],
      ['min signed hex input', Long.MIN_VALUE.toString(16), false, 16],
      ['signed zeros', '+000000', false, 10, '0'],
      ['unsigned zero', '0', true, 10],
      ['explicit positive no leading zeros', '+32', true, 10, '32'],
      // the following inputs are valid radix 36 inputs, but will not represent NaN or +/- Infinity
      ['radix 36 Infinity', 'Infinity', false, 36],
      ['radix 36 -Infinity', '-Infinity', false, 36],
      ['radix 36 +Infinity', '+Infinity', false, 36, 'infinity'],
      ['radix 36 NaN', 'NaN', false, 36],
      ['overload no unsigned and no radix parameter', '-32', undefined, undefined],
      ['overload no unsigned parameter', '-32', undefined, 12],
      ['overload no radix parameter', '32', true, undefined]
    ];

    const failureInputs: [
      name: string,
      input: string,
      unsigned: boolean | undefined,
      radix: number | undefined
    ][] = [
      ['empty string', '', true, 2],
      ['invalid numbers in binary string', '234', true, 2],
      ['non a-z or numeric string', '~~', true, 36],
      ['alphabet in radix < 10', 'a', true, 9],
      ['radix does not allow all alphabet letters', 'eee', false, 14],
      ['over max unsigned binary input', Long.MAX_UNSIGNED_VALUE.toString(2) + '1', true, 2],
      ['over max unsigned decimal input', Long.MAX_UNSIGNED_VALUE.toString(10) + '1', true, 10],
      ['over max unsigned hex input', Long.MAX_UNSIGNED_VALUE.toString(16) + '1', true, 16],
      ['over max signed binary input', Long.MAX_VALUE.toString(2) + '1', false, 2],
      ['over max signed decimal input', Long.MAX_VALUE.toString(10) + '1', false, 10],
      ['over max signed hex input', Long.MAX_VALUE.toString(16) + '1', false, 16],
      ['under min signed binary input', Long.MIN_VALUE.toString(2) + '1', false, 2],
      ['under min signed decimal input', Long.MIN_VALUE.toString(10) + '1', false, 10],
      ['under min signed hex input', Long.MIN_VALUE.toString(16) + '1', false, 16],
      ['string with whitespace', '      3503a  ', false, 11],
      ['negative zero unsigned', '-0', true, 9],
      ['negative zero signed', '-0', false, 13],
      ['radix 1', '12', false, 1],
      ['negative radix', '12', false, -4],
      ['radix over 36', '12', false, 37],
      // the following inputs are invalid radix 16 inputs
      // this is because of the characters, not because of the values they commonly represent
      ['radix 10 Infinity', 'Infinity', false, 10],
      ['radix 10 -Infinity', '-Infinity', false, 10],
      ['radix 10 +Infinity', '+Infinity', false, 10],
      ['radix 10 NaN', 'NaN', false, 10],
      ['overload no radix parameter and invalid sign', '-32', true, undefined]
    ];

    for (const [testName, str, unsigned, radix, expectedStr] of successInputs) {
      context(`when the input is ${testName}`, () => {
        it(`should return a Long representation of the input`, () => {
          expect(Long.fromStringStrict(str, unsigned, radix).toString(radix)).to.equal(
            expectedStr ?? str.toLowerCase()
          );
        });
      });
    }
    for (const [testName, str, unsigned, radix] of failureInputs) {
      context(`when the input is ${testName}`, () => {
        it(`should throw BSONError`, () => {
          expect(() => Long.fromStringStrict(str, unsigned, radix)).to.throw(BSONError);
        });
      });
    }
  });
});
