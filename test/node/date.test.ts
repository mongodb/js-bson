import { expect } from 'chai';
import * as BSON from '../register-bson';
import { bufferFromHexArray } from './tools/utils';

const DATE_MAX = 8640000000000000;
const DATE_MIN = -8640000000000000;

const DATE_MAX_BYTES = (() => {
  const b = Buffer.alloc(8);
  b.writeBigInt64LE(BigInt(DATE_MAX + 1));
  return b.toString('hex');
})();
const DATE_MIN_BYTES = (() => {
  const b = Buffer.alloc(8);
  b.writeBigInt64LE(BigInt(DATE_MIN - 1));
  return b.toString('hex');
})();

describe('new Date()', () => {
  describe('when given an Invalid Date', () => {
    describe('serialize()', () => {
      const test = d => () => {
        const bytes = BSON.serialize({ d });
        expect(bytes).to.deep.equal(
          bufferFromHexArray([
            '09', // date
            '6400', // 'd' key with key null terminator
            '00'.repeat(8) // little endian int64 (NaN coerce to 0)
          ])
        );
      };

      it(
        'creates bson bytes with date value set to zero (DATE_MAX + 1)',
        test(new Date(DATE_MAX + 1))
      );

      it(
        'creates bson bytes with date value set to zero (DATE_MIN - 1)',
        test(new Date(DATE_MIN - 1))
      );
    });

    describe('deserialize()', () => {
      const test = dateBytes => () => {
        const doc = BSON.deserialize(
          bufferFromHexArray([
            '09', // date
            '6400', // 'd' key with key null terminator
            dateBytes // little endian int64 (DATE_MAX + 1)
          ])
        );

        expect(doc).to.have.property('d').that.is.a('date');
        expect(doc.d.getTime()).to.be.NaN;
      };

      it('returns a JS object with an invalid date (DATE_MAX + 1)', test(DATE_MAX_BYTES));
      it('returns a JS object with an invalid date (DATE_MIN - 1)', test(DATE_MIN_BYTES));
    });
  });

  describe.only('when given a Date before the epoch', () => {
    it('returns a negative time value', function () {
      const date = new Date('1965-11-12T12:00:30.798Z');

      const doc = { date };
      const serialized_data = BSON.serialize(doc);
      const deserialized_data = BSON.deserialize(serialized_data);
      expect(deserialized_data.date).to.deep.equal(date);
      expect(deserialized_data.date.getTime()).to.equal(date.getTime());
      expect(serialized_data.subarray(10, 18)).to.deep.equal(
        Buffer.from([0x4e, 0xa2, 0x2a, 0x9d, 0xe2, 0xff, 0xff, 0xff])
      );
    });
  });
});
