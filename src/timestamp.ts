import { Long } from './long';

/** @public */
export type TimestampOverrides = '_bsontype' | 'toExtendedJSON' | 'fromExtendedJSON' | 'inspect';
/** @public */
export type LongWithoutOverrides = new (low: number | Long, high?: number, unsigned?: boolean) => {
  [P in Exclude<keyof Long, TimestampOverrides>]: Long[P];
};
/** @public */
export const LongWithoutOverridesClass: LongWithoutOverrides = (Long as unknown) as LongWithoutOverrides;

/** @public */
export interface TimestampExtended {
  $timestamp: {
    t: number;
    i: number;
  };
}

/** @public */
export class Timestamp extends LongWithoutOverridesClass {
  _bsontype!: 'Timestamp';

  static readonly MAX_VALUE = Long.MAX_UNSIGNED_VALUE;

  /**
   * @param low - A 64-bit Long representing the Timestamp.
   */
  constructor(low: Long);
  /**
   * @param low - the low (signed) 32 bits of the Timestamp.
   * @param high - the high (signed) 32 bits of the Timestamp.
   */
  constructor(low: number, high: number);
  constructor(low: number | Long, high?: number) {
    if (Long.isLong(low)) {
      super(low.low, low.high, true);
    } else {
      super(low, high, true);
    }
    Object.defineProperty(this, '_bsontype', {
      value: 'Timestamp',
      writable: false,
      configurable: false,
      enumerable: false
    });
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
   * Returns a Timestamp for the given high and low bits. Each is assumed to use 32 bits.
   *
   * @param lowBits - the low 32-bits.
   * @param highBits - the high 32-bits.
   */
  static fromBits(lowBits: number, highBits: number): Timestamp {
    return new Timestamp(lowBits, highBits);
  }

  /**
   * Returns a Timestamp from the given string, optionally using the given radix.
   *
   * @param str - the textual representation of the Timestamp.
   * @param optRadix - the radix in which the text is written.
   */
  static fromString(str: string, optRadix: number): Timestamp {
    return new Timestamp(Long.fromString(str, true, optRadix));
  }

  /** @internal */
  toExtendedJSON(): TimestampExtended {
    return { $timestamp: { t: this.high >>> 0, i: this.low >>> 0 } };
  }

  /** @internal */
  static fromExtendedJSON(doc: TimestampExtended): Timestamp {
    return new Timestamp(doc.$timestamp.i, doc.$timestamp.t);
  }

  /** @internal */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.inspect();
  }

  inspect(): string {
    return `Timestamp(${this.getLowBits().toString()}, ${this.getHighBits().toString()})`;
  }
}
