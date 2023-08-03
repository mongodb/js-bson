import { expect } from 'chai';
import * as BSON from '../register-bson';
import { Timestamp } from '../register-bson';

describe('Timestamp', () => {
  describe('static MAX_VALUE', () => {
    it('equals Long.MAX_UNSIGNED_VALUE', () => {
      expect(BSON.Timestamp.MAX_VALUE).to.equal(BSON.Long.MAX_UNSIGNED_VALUE);
    });
  });

  it('should always be an unsigned value', () => {
    const table = [
      // @ts-expect-error: Not advertized by the types, but constructs a 0 timestamp
      new BSON.Timestamp(),
      new BSON.Timestamp(0xffffffffffn),
      new BSON.Timestamp(0xffffffffffffffffn),
      new BSON.Timestamp(new BSON.Long(0xffff_ffff, 0xffff_ffff, false)),
      new BSON.Timestamp(new BSON.Long(0xffff_ffff, 0xffff_ffff, true)),
      new BSON.Timestamp({ t: 0xffff_ffff, i: 0xffff_ffff }),
      // @ts-expect-error We do not advertise support for Int32 in the constructor of Timestamp
      // We do expect it to work so that round tripping the Int32 instance inside a Timestamp works
      new BSON.Timestamp({ t: new BSON.Int32(0x7fff_ffff), i: new BSON.Int32(0x7fff_ffff) })
    ];
    for (const timestamp of table) {
      expect(timestamp.t).to.be.gte(0);
      expect(timestamp.i).to.be.gte(0);
    }
  });

  context('output formats', () => {
    const timestamp = new BSON.Timestamp(0xffffffffffffffffn);

    context('when converting toString', () => {
      it('exports an unsigned number', () => {
        expect(timestamp.toString()).to.equal('18446744073709551615');
      });
    });

    context('when converting toJSON', () => {
      it('exports an unsigned number', () => {
        expect(timestamp.toJSON()).to.deep.equal({ $timestamp: '18446744073709551615' });
      });
    });

    context('when converting toExtendedJSON', () => {
      it('exports an unsigned number', () => {
        // @ts-expect-error toExtendedJSON is an internal method
        expect(timestamp.toExtendedJSON()).to.deep.equal({
          $timestamp: { t: 4294967295, i: 4294967295 }
        });
      });
    });
  });

  describe('new Timestamp()', () => {
    it('accepts { t, i } object as input', () => {
      const input = { t: 89, i: 144 };
      const timestamp = new BSON.Timestamp(input);
      // @ts-expect-error toExtendedJSON is an internal method
      expect(timestamp.toExtendedJSON()).to.deep.equal({ $timestamp: input });
    });

    it('accepts { t, i } object as input and coerce to integer', () => {
      const input = { t: new BSON.Int32(89), i: new BSON.Int32(144) };
      // @ts-expect-error We do not advertise support for Int32 in the constructor of Timestamp
      const timestamp = new BSON.Timestamp(input);
      // @ts-expect-error toExtendedJSON is an internal method
      expect(timestamp.toExtendedJSON()).to.deep.equal({ $timestamp: { t: 89, i: 144 } });
    });

    describe('validation cases', () => {
      const table = [
        {
          title: 'throws when t is an object that is not an Int32',
          test: () =>
            // @ts-expect-error: testing bad input
            new Timestamp({
              t: {
                // Adding a valueOf function here to make sure number-like object still error.
                valueOf() {
                  return 2;
                }
              },
              i: 2
            }),
          message: /must provide t as a number/
        },
        {
          title: 'throws when i is an object that is not an Int32',
          test: () =>
            // @ts-expect-error: testing bad input
            new Timestamp({
              t: 2,
              i: {
                // Adding a valueOf function here to make sure number-like object still error.
                valueOf() {
                  return 2;
                }
              }
            }),
          message: /must provide i as a number/
        },
        {
          title: 'throws when t is not a number',
          test: () =>
            // @ts-expect-error: testing bad input
            new Timestamp({ t: true, i: 2 }),
          message: /must provide t as a number/
        },
        {
          title: 'throws when i is not a number',
          test: () =>
            // @ts-expect-error: testing bad input
            new Timestamp({ t: 2, i: true }),
          message: /must provide i as a number/
        },
        {
          title: 'throws when t is negative',
          test: () => new Timestamp({ t: -2, i: 2 }),
          message: /must provide a positive t/
        },
        {
          title: 'throws when i is negative',
          test: () => new Timestamp({ t: 2, i: -2 }),
          message: /must provide a positive i/
        },
        {
          title: 'throws when t is above uint32 max',
          test: () => new Timestamp({ t: 0xffff_ffff + 1, i: 2 }),
          message: /must provide t equal or less than uint32 max/
        },
        {
          title: 'throws when i is above uint32 max',
          test: () => new Timestamp({ t: 2, i: 0xffff_ffff + 1 }),
          message: /must provide i equal or less than uint32 max/
        },
        {
          title: 'throws when two numbers are passed as arguments',
          // @ts-expect-error: testing bad inputs
          test: () => new Timestamp(2, 3),
          message: /can only be constructed with/
        },
        {
          title: 'throws on a completely unsupported input',
          // @ts-expect-error: testing bad inputs, symbol is arbitrary here
          test: () => new Timestamp(Symbol('a')),
          message: /can only be constructed with/
        }
      ];

      for (const { title, test, message } of table) {
        it(title, () => {
          expect(test).to.throw(message);
        });
      }
    });
  });
});
