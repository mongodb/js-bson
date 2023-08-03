import { BSONValue } from './bson_value';
import { BSONError } from './error';
import type { Int32 } from './int_32';
import { Long } from './long';

/** @public */
export type TimestampOverrides = '_bsontype' | 'toExtendedJSON' | 'fromExtendedJSON' | 'inspect';

/** @public */
export interface TimestampExtended {
  $timestamp: {
    t: number;
    i: number;
  };
}

/**
 * @public
 * @category BSONType
 */
export class Timestamp extends BSONValue {
  get _bsontype(): 'Timestamp' {
    return 'Timestamp';
  }

  static readonly MAX_VALUE = new Timestamp(Long.MAX_UNSIGNED_VALUE);
  /**
   * Upper 4 bytes representing the timestamp value
   */
  readonly t: number;
  /**
   * Lower 4 bytes representing the increment value
   */
  readonly i: number;

  /**
   * @param int - A 64-bit bigint representing the Timestamp.
   */
  constructor(int: bigint);
  /**
   * @param long - A 64-bit Long representing the Timestamp.
   */
  constructor(long: Long);
  /**
   * @param value - A pair of two values indicating timestamp and increment.
   */
  constructor(value: { t: number; i: number });
  constructor(low?: bigint | Long | { t: number | Int32; i: number | Int32 }) {
    // Note we use the unsigned right shift to ensure that the t and i fields are interpreted as
    // unsigned int32 values
    super();
    if (low == null) {
      this.t = 0;
      this.i = 0;
    } else if (typeof low === 'bigint') {
      const asLong = new Long(low);
      // high bytes are secs
      this.t = asLong.high >>> 0;
      // low bytes are increment
      this.i = asLong.low >>> 0;
    } else if (Long.isLong(low)) {
      this.t = low.high >>> 0;
      this.i = low.low >>> 0;
    } else if (typeof low === 'object' && 't' in low && 'i' in low) {
      if (typeof low.t !== 'number' && (typeof low.t !== 'object' || low.t._bsontype !== 'Int32')) {
        throw new BSONError('Timestamp constructed from { t, i } must provide t as a number');
      }
      if (typeof low.i !== 'number' && (typeof low.i !== 'object' || low.i._bsontype !== 'Int32')) {
        throw new BSONError('Timestamp constructed from { t, i } must provide i as a number');
      }
      const t = Number(low.t);
      const i = Number(low.i);
      if (t < 0 || Number.isNaN(t)) {
        throw new BSONError('Timestamp constructed from { t, i } must provide a positive t');
      }
      if (i < 0 || Number.isNaN(i)) {
        throw new BSONError('Timestamp constructed from { t, i } must provide a positive i');
      }
      if (t > 0xffff_ffff) {
        throw new BSONError(
          'Timestamp constructed from { t, i } must provide t equal or less than uint32 max'
        );
      }
      if (i > 0xffff_ffff) {
        throw new BSONError(
          'Timestamp constructed from { t, i } must provide i equal or less than uint32 max'
        );
      }
      this.t = t >>> 0;
      this.i = i >>> 0;
    } else {
      throw new BSONError(
        'A Timestamp can only be constructed with: bigint, Long, or { t: number; i: number }'
      );
    }
  }

  toJSON(): { $timestamp: string } {
    return {
      $timestamp: this.toString()
    };
  }

  /** Returns a Timestamp represented by the given (32-bit) integer value. */
  static fromInt(value: number): Timestamp {
    return new Timestamp(Long.fromInt(value, true));
  }

  /** Returns a Timestamp representing the given number value, provided that it is a finite number. Otherwise, zero is returned. */
  static fromNumber(value: number): Timestamp {
    return new Timestamp(Long.fromNumber(value, true));
  }

  /**
   * Returns a Timestamp for the given increment and numeric timestamp. Each is assumed to use 32 bits.
   *
   * @param i - the increment
   * @param t - the timestamp
   */
  static fromBits(i: number, t: number): Timestamp {
    return new Timestamp({ i: i, t: t });
  }

  /**
   * Returns a Timestamp from the given string, optionally using the given radix.
   *
   * @param str - the textual representation of the Timestamp.
   * @param optRadix - the radix in which the text is written.
   * @returns The corresponding Timestamp value
   */
  static fromString(str: string, optRadix?: number): Timestamp {
    return new Timestamp(Long.fromString(str, true, optRadix));
  }

  /** @internal */
  toExtendedJSON(): TimestampExtended {
    return { $timestamp: { t: this.t >>> 0, i: this.i >>> 0 } };
  }

  /** @internal */
  static fromExtendedJSON(doc: TimestampExtended): Timestamp {
    // The Long check is necessary because extended JSON has different behavior given the size of the input number
    const i = Long.isLong(doc.$timestamp.i)
      ? doc.$timestamp.i.getLowBitsUnsigned() // Need to fetch the least significant 32 bits
      : doc.$timestamp.i;
    const t = Long.isLong(doc.$timestamp.t)
      ? doc.$timestamp.t.getLowBitsUnsigned() // Need to fetch the least significant 32 bits
      : doc.$timestamp.t;
    return new Timestamp({ t, i });
  }

  /** @internal */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.inspect();
  }

  inspect(): string {
    return `new Timestamp({ t: ${this.t}, i: ${this.i} })`;
  }

  /** @internal */
  toString(): string {
    return this.toLong().toString();
  }

  /** @returns Long representation of timestamp where low 4 bytes are increment and high 4 bytes are
   * timestamp*/
  toLong(): Long {
    return new Long(this.i, this.t, true);
  }
}
