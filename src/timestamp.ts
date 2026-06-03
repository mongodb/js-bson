import { bsonType } from './bson_value';
import { BSONError } from './error';
import type { Int32 } from './int_32';
import { Long } from './long';
import { type InspectFn, defaultInspect } from './parser/utils';

/**
 * @public
 * @deprecated This type is no longer used internally and will be removed in a future version.
 */
export type TimestampOverrides =
  | '_bsontype'
  | 'toExtendedJSON'
  | 'fromExtendedJSON'
  | 'inspect'
  | typeof bsonType;

/**
 * @public
 *
 * Inherited `Long` members surfaced on `Timestamp`.
 * When `Long` gains a new member: add it here if it should pass through, or
 * add a `@deprecated declare` line on the `Timestamp` class if it should be
 * surfaced as deprecated. Anything left unclassified is silently dropped from
 * the public type — preventing accidental behavioral bleed-through.
 */
type TimestampKept =
  | 'toBigInt'
  | 'toString'
  | 'compare'
  | 'equals'
  | 'eq'
  | 'notEquals'
  | 'neq'
  | 'ne'
  | 'lessThan'
  | 'lt'
  | 'lessThanOrEqual'
  | 'lte'
  | 'le'
  | 'greaterThan'
  | 'gt'
  | 'greaterThanOrEqual'
  | 'gte'
  | 'ge';

/** @public */
export type LongWithoutOverrides = new (
  low: unknown,
  high?: number | boolean,
  unsigned?: boolean
) => {
  [P in TimestampKept]: Long[P];
};
/** @public */
export const LongWithoutOverridesClass: LongWithoutOverrides =
  Long as unknown as LongWithoutOverrides;

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
 *
 * A special type for _internal_ MongoDB use and is **not** associated with the regular Date type.
 */
export class Timestamp extends LongWithoutOverridesClass {
  get _bsontype(): 'Timestamp' {
    return 'Timestamp';
  }
  get [bsonType](): 'Timestamp' {
    return 'Timestamp';
  }

  /**
   * @deprecated Use `Long.MAX_UNSIGNED_VALUE` instead.
   */
  static readonly MAX_VALUE = Long.MAX_UNSIGNED_VALUE;

  /**
   * An incrementing ordinal for operations within a given second.
   */
  get i(): number {
    return this.low >>> 0;
  }

  /**
   * A `time_t` value measuring seconds since the Unix epoch
   */
  get t(): number {
    return this.high >>> 0;
  }

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
    if (low == null) {
      super(0, 0, true);
    } else if (typeof low === 'bigint') {
      super(low, true);
    } else if (Long.isLong(low)) {
      super(low.low, low.high, true);
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

      super(i, t, true);
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

  /**
   * Returns a Timestamp represented by the given (32-bit) integer value.
   * @deprecated Stores `value` in the low 32 bits (increment), leaving t = 0. Use `new Timestamp({ t, i })` or `Timestamp.fromBits(lowBits, highBits)` for explicit construction.
   */
  static fromInt(value: number): Timestamp {
    return new Timestamp(Long.fromInt(value, true));
  }

  /**
   * Returns a Timestamp representing the given number value, provided that it is a finite number. Otherwise, zero is returned.
   * @deprecated Splits `value` across (t, i) as a uint64; the result rarely matches user intent. Use `new Timestamp({ t, i })` or `Timestamp.fromBits(lowBits, highBits)` for explicit construction.
   */
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
    return new Timestamp({ i: lowBits, t: highBits });
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
    return { $timestamp: { t: this.t, i: this.i } };
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

  inspect(depth?: number, options?: unknown, inspect?: InspectFn): string {
    inspect ??= defaultInspect;
    const t = inspect(this.t, options);
    const i = inspect(this.i, options);
    return `new Timestamp({ t: ${t}, i: ${i} })`;
  }

  // ********************
  // **** DEPRECATED ****
  // ********************
  // Declare used to avoid runtime effects for field declaration.
  // See: https://www.typescriptlang.org/docs/handbook/2/classes.html#type-only-field-declarations

  // Arithmetic
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare add: Long['add'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare subtract: Long['subtract'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare sub: Long['sub'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare multiply: Long['multiply'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare mul: Long['mul'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare divide: Long['divide'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare div: Long['div'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare modulo: Long['modulo'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare mod: Long['mod'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare rem: Long['rem'];
  /** @deprecated Not applicable to Timestamp as the underlying Long is always unsigned. */
  declare negate: Long['negate'];
  /** @deprecated Not applicable to Timestamp as the underlying Long is always unsigned. */
  declare neg: Long['neg'];

  // Bitwise / shifts
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare and: Long['and'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare or: Long['or'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare xor: Long['xor'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare not: Long['not'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare shiftLeft: Long['shiftLeft'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare shl: Long['shl'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare shiftRight: Long['shiftRight'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare shr: Long['shr'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare shiftRightUnsigned: Long['shiftRightUnsigned'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare shr_u: Long['shr_u'];
  /** @deprecated Not applicable to Timestamp; Timestamp is not intended to be used as a Long. */
  declare shru: Long['shru'];

  // Signing
  /** @deprecated Not applicable to Timestamp as the underlying Long is always unsigned. */
  declare toSigned: Long['toSigned'];
  /** @deprecated Not applicable to Timestamp as the underlying Long is always unsigned (this is a no-op). */
  declare toUnsigned: Long['toUnsigned'];
  /** @deprecated Not applicable to Timestamp as the underlying Long is always unsigned (is always false). */
  declare isNegative: Long['isNegative'];
  /** @deprecated Not applicable to Timestamp as the underlying Long is always unsigned (is always true). */
  declare isPositive: Long['isPositive'];
  /** @deprecated Not applicable to Timestamp as the underlying Long is always unsigned (is always true). */
  declare unsigned: Long['unsigned'];

  // Conversion
  /** @deprecated Not applicable to Timestamp; use `.t` for seconds since the Unix epoch, or `.i` for the increment ordinal. */
  declare toInt: Long['toInt'];
  /** @deprecated Not applicable to Timestamp; use `.t` for seconds since the Unix epoch, or `.i` for the increment ordinal. */
  declare toNumber: Long['toNumber'];
  /** @deprecated Not applicable to Timestamp; use `.t` for seconds since the Unix epoch, or `.i` for the increment ordinal. */
  declare toBytes: Long['toBytes'];
  /** @deprecated Not applicable to Timestamp; use `.t` for seconds since the Unix epoch, or `.i` for the increment ordinal. */
  declare toBytesLE: Long['toBytesLE'];
  /** @deprecated Not applicable to Timestamp; use `.t` for seconds since the Unix epoch, or `.i` for the increment ordinal. */
  declare toBytesBE: Long['toBytesBE'];

  // Other
  /** @deprecated Incompatible with Timestamp: returns a signed integer, but Timestamp is always unsigned. Use `.t` for seconds since the Unix epoch. */
  declare getHighBits: Long['getHighBits'];
  /** @deprecated Not applicable to Timestamp; use `.t` for seconds since the Unix epoch. */
  declare getHighBitsUnsigned: Long['getHighBitsUnsigned'];
  /** @deprecated Incompatible with Timestamp: returns a signed integer, but Timestamp is always unsigned. Use `.i` for the increment ordinal. */
  declare getLowBits: Long['getLowBits'];
  /** @deprecated Not applicable to Timestamp; use `.i` for the increment ordinal. */
  declare getLowBitsUnsigned: Long['getLowBitsUnsigned'];

  /** @deprecated Not applicable to Timestamp; use `.i` instead. */
  declare low: Long['low'];
  /** @deprecated Not applicable to Timestamp; use `.t` instead. */
  declare high: Long['high'];

  /** @deprecated Use .compare() for general comparison, or .equals(), .lessThan(), .greaterThan() for specific cases. */
  declare comp: Long['comp'];
  /** @deprecated Compare `.t` and `.i` against `0` explicitly. */
  declare isZero: Long['isZero'];
  /** @deprecated Compare `.t` and `.i` against `0` explicitly. */
  declare eqz: Long['eqz'];

  /** @deprecated Not applicable to Timestamp. Use the bsonType symbol or _bsontype === 'Timestamp' to identify a Timestamp. */
  declare __isLong__: Long['__isLong__'];
  /** @deprecated Not applicable to Timestamp. */
  declare getNumBitsAbs: Long['getNumBitsAbs'];
  /** @deprecated Not applicable to Timestamp; tests parity of the increment only. */
  declare isEven: Long['isEven'];
  /** @deprecated Not applicable to Timestamp; tests parity of the increment only. */
  declare isOdd: Long['isOdd'];
}
