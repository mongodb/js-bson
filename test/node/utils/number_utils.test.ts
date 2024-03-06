import { expect } from 'chai';
import { NumberUtils } from '../../../src/utils/number_utils';

describe('NumberUtils', () => {
  /** Make a Uint8Array in a less verbose way */
  const b = (...values) => new Uint8Array(values);

  context('getInt32LE()', () => {
    it('parses an int32 little endian', () => {
      expect(NumberUtils.getInt32LE(b(0, 0, 0, 1), 0)).to.equal(1 << 24);
    });

    it('parses an signed int32 little endian', () => {
      expect(NumberUtils.getInt32LE(b(255, 255, 255, 255), 0)).to.equal(-1);
    });

    it('parses an int32 little endian at offset', () => {
      expect(NumberUtils.getInt32LE(b(0, 0, 0, 0, 0, 1), 2)).to.equal(1 << 24);
    });

    it('does not check bounds of offset', () => {
      expect(NumberUtils.getInt32LE(b(0, 0, 0, 1), 4)).to.equal(0);
    });
  });

  context('getUint32LE()', () => {
    it('parses an unsigned int32 little endian', () => {
      expect(NumberUtils.getUint32LE(b(255, 255, 255, 255), 0)).to.equal(0xffff_ffff);
    });

    it('parses an int32 little endian at offset', () => {
      expect(NumberUtils.getUint32LE(b(0, 0, 255, 255, 255, 255), 2)).to.equal(0xffff_ffff);
    });

    it('does not check bounds of offset', () => {
      expect(NumberUtils.getUint32LE(b(0, 0, 0, 1), 4)).to.be.NaN;
    });
  });

  context('getUint32BE()', () => {
    it('parses an int32 big endian', () => {
      expect(NumberUtils.getUint32BE(b(0, 0, 0, 1), 0)).to.equal(1);
    });

    it('parses an unsigned int32 big endian', () => {
      expect(NumberUtils.getUint32LE(b(255, 255, 255, 255), 0)).to.equal(0xffff_ffff);
    });

    it('parses an int32 big endian at offset', () => {
      expect(NumberUtils.getUint32BE(b(0, 0, 0, 0, 0, 1), 2)).to.equal(1);
    });

    it('does not check bounds of offset', () => {
      expect(NumberUtils.getUint32BE(b(0, 0, 0, 1), 4)).to.be.NaN;
    });
  });

  context('getBigInt64LE()', () => {
    it('parses an int64 little endian', () => {
      expect(NumberUtils.getBigInt64LE(b(0, 0, 0, 0, 0, 0, 0, 1), 0)).to.equal(1n << 56n);
    });

    it('parses an int64 little endian at offset', () => {
      expect(NumberUtils.getBigInt64LE(b(0, 0, 0, 0, 0, 0, 0, 0, 0, 1), 2)).to.equal(1n << 56n);
    });

    it('throws if offset is out of bounds', () => {
      expect(() => NumberUtils.getBigInt64LE(b(0, 0, 0, 0, 0, 0, 0, 1), 4)).to.throw(RangeError);
    });
  });

  context('getFloat64LE()', () => {
    /** 2.3 in bytes */
    const num = [0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x02, 0x40];

    it('parses an float64 little endian', () => {
      expect(NumberUtils.getFloat64LE(b(...num), 0)).to.equal(2.3);
    });

    it('parses an float64 little endian at offset', () => {
      expect(NumberUtils.getFloat64LE(b(0, 0, ...num), 2)).to.equal(2.3);
    });

    it('does not check bounds of offset', () => {
      expect(NumberUtils.getFloat64LE(b(...num), 4)).to.not.equal(2.3);
    });
  });

  context('setInt32BE()', () => {
    it('writes an int32 big endian', () => {
      const space = new Uint8Array(4);
      expect(NumberUtils.setInt32BE(space, 0, 1)).to.equal(4);
      expect(space).to.deep.equal(b(0, 0, 0, 1));
    });

    it('writes an int32 big endian at offset', () => {
      const space = new Uint8Array(6);
      expect(NumberUtils.setInt32BE(space, 2, 1)).to.equal(4);
      expect(space).to.deep.equal(b(0, 0, 0, 0, 0, 1));
    });

    it('does not bound or type check', () => {
      const space = {};
      // @ts-expect-error: testing incorrect type
      expect(NumberUtils.setInt32BE(space, 'a', 1)).to.equal(4);
      expect(space).to.deep.equal({ a: 0, a1: 0, a2: 0, a3: 1 });
    });
  });

  context('setInt32LE()', () => {
    it('writes an int32 big endian', () => {
      const space = new Uint8Array(4);
      expect(NumberUtils.setInt32LE(space, 0, 1)).to.equal(4);
      expect(space).to.deep.equal(b(1, 0, 0, 0));
    });

    it('writes an int32 big endian at offset', () => {
      const space = new Uint8Array(6);
      expect(NumberUtils.setInt32LE(space, 2, 1)).to.equal(4);
      expect(space).to.deep.equal(b(0, 0, 1, 0, 0, 0));
    });

    it('does not bound or type check', () => {
      const space = {};
      // @ts-expect-error: testing incorrect type
      expect(NumberUtils.setInt32LE(space, 'a', 1)).to.equal(4);
      expect(space).to.deep.equal({ a: 1, a1: 0, a2: 0, a3: 0 });
    });
  });
});
