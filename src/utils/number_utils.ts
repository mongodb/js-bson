const FLOAT = new Float64Array(1);
const FLOAT_BYTES = new Uint8Array(FLOAT.buffer, 0, 8);

FLOAT[0] = -1;
// Little endian [0, 0, 0, 0, 0, 0,  240, 191]
// Big endian    [191, 240, 0, 0, 0, 0, 0, 0]
const isBigEndian = FLOAT_BYTES[7] === 0;

/**
 * Number parsing and serializing utilities.
 *
 * @internal
 */
export const NumberUtils = {
  /** Reads a little-endian 32-bit integer from source */
  getInt32LE(source: Uint8Array, offset: number): number {
    return (
      source[offset] |
      (source[offset + 1] << 8) |
      (source[offset + 2] << 16) |
      (source[offset + 3] << 24)
    );
  },

  /** Reads a little-endian 32-bit unsigned integer from source */
  getUint32LE(source: Uint8Array, offset: number): number {
    return (
      source[offset] +
      source[offset + 1] * 256 +
      source[offset + 2] * 65536 +
      source[offset + 3] * 16777216
    );
  },

  /** Reads a big-endian 32-bit integer from source */
  getUint32BE(source: Uint8Array, offset: number): number {
    return (
      source[offset + 3] +
      source[offset + 2] * 256 +
      source[offset + 1] * 65536 +
      source[offset] * 16777216
    );
  },

  /** Reads a little-endian 64-bit integer from source */
  getBigInt64LE(source: Uint8Array, offset: number): bigint {
    const lo = NumberUtils.getUint32LE(source, offset);
    const hi = NumberUtils.getUint32LE(source, offset + 4);

    /*
      eslint-disable-next-line no-restricted-globals
      -- This is allowed since this helper should not be called unless bigint features are enabled
     */
    return (BigInt(hi) << BigInt(32)) + BigInt(lo);
  },

  /** Reads a little-endian 64-bit float from source */
  getFloat64LE: isBigEndian
    ? (source: Uint8Array, offset: number) => {
        FLOAT_BYTES[7] = source[offset];
        FLOAT_BYTES[6] = source[offset + 1];
        FLOAT_BYTES[5] = source[offset + 2];
        FLOAT_BYTES[4] = source[offset + 3];
        FLOAT_BYTES[3] = source[offset + 4];
        FLOAT_BYTES[2] = source[offset + 5];
        FLOAT_BYTES[1] = source[offset + 6];
        FLOAT_BYTES[0] = source[offset + 7];
        return FLOAT[0];
      }
    : (source: Uint8Array, offset: number) => {
        FLOAT_BYTES[0] = source[offset];
        FLOAT_BYTES[1] = source[offset + 1];
        FLOAT_BYTES[2] = source[offset + 2];
        FLOAT_BYTES[3] = source[offset + 3];
        FLOAT_BYTES[4] = source[offset + 4];
        FLOAT_BYTES[5] = source[offset + 5];
        FLOAT_BYTES[6] = source[offset + 6];
        FLOAT_BYTES[7] = source[offset + 7];
        return FLOAT[0];
      },

  /** Writes a big-endian 32-bit integer to destination, can be signed or unsigned */
  setInt32BE(destination: Uint8Array, offset: number, value: number): 4 {
    destination[offset + 3] = value;
    value >>>= 8;
    destination[offset + 2] = value;
    value >>>= 8;
    destination[offset + 1] = value;
    value >>>= 8;
    destination[offset] = value;
    return 4;
  },

  /** Writes a little-endian 32-bit integer to destination, can be signed or unsigned */
  setInt32LE(destination: Uint8Array, offset: number, value: number): 4 {
    destination[offset] = value;
    value >>>= 8;
    destination[offset + 1] = value;
    value >>>= 8;
    destination[offset + 2] = value;
    value >>>= 8;
    destination[offset + 3] = value;
    return 4;
  },

  /** Write a little-endian 64-bit integer to source */
  setBigInt64LE(destination: Uint8Array, offset: number, value: bigint): 8 {
    /* eslint-disable-next-line no-restricted-globals -- This is allowed here as useBigInt64=true */
    const mask32bits = BigInt(0xffff_ffff);

    /** lower 32 bits */
    let lo = Number(value & mask32bits);
    destination[offset] = lo;
    lo >>= 8;
    destination[offset + 1] = lo;
    lo >>= 8;
    destination[offset + 2] = lo;
    lo >>= 8;
    destination[offset + 3] = lo;

    /*
       eslint-disable-next-line no-restricted-globals
       -- This is allowed here as useBigInt64=true

       upper 32 bits
     */
    let hi = Number((value >> BigInt(32)) & mask32bits);
    destination[offset + 4] = hi;
    hi >>= 8;
    destination[offset + 5] = hi;
    hi >>= 8;
    destination[offset + 6] = hi;
    hi >>= 8;
    destination[offset + 7] = hi;

    return 8;
  },

  /** Writes a little-endian 64-bit float to destination */
  setFloat64LE: isBigEndian
    ? (destination: Uint8Array, offset: number, value: number) => {
        FLOAT[0] = value;
        destination[offset] = FLOAT_BYTES[7];
        destination[offset + 1] = FLOAT_BYTES[6];
        destination[offset + 2] = FLOAT_BYTES[5];
        destination[offset + 3] = FLOAT_BYTES[4];
        destination[offset + 4] = FLOAT_BYTES[3];
        destination[offset + 5] = FLOAT_BYTES[2];
        destination[offset + 6] = FLOAT_BYTES[1];
        destination[offset + 7] = FLOAT_BYTES[0];
        return 8;
      }
    : (destination: Uint8Array, offset: number, value: number) => {
        FLOAT[0] = value;
        destination[offset] = FLOAT_BYTES[0];
        destination[offset + 1] = FLOAT_BYTES[1];
        destination[offset + 2] = FLOAT_BYTES[2];
        destination[offset + 3] = FLOAT_BYTES[3];
        destination[offset + 4] = FLOAT_BYTES[4];
        destination[offset + 5] = FLOAT_BYTES[5];
        destination[offset + 6] = FLOAT_BYTES[6];
        destination[offset + 7] = FLOAT_BYTES[7];
        return 8;
      }
};
