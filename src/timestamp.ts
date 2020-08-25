import { Long } from './long';

/**
 * @class
 * @param {number} low  the low (signed) 32 bits of the Timestamp.
 * @param {number} high the high (signed) 32 bits of the Timestamp.
 * @return {Timestamp}
 */
export class Timestamp extends Long {
  constructor(low: Long);
  constructor(low: number, high: number);
  constructor(low: number | Long, high?: number) {
    if (Long.isLong(low)) {
      super(low.low, low.high, true);
    } else {
      super(low, high, true);
    }
    this._bsontype = 'Timestamp';
  }

  /**
   * Return the JSON value.
   *
   * @method
   * @return {String} the JSON representation.
   */
  toJSON() {
    return {
      $timestamp: this.toString()
    };
  }

  /**
   * Returns a Timestamp represented by the given (32-bit) integer value.
   *
   * @method
   * @param {number} value the 32-bit integer in question.
   * @return {Timestamp} the timestamp.
   */
  static fromInt(value) {
    return new Timestamp(Long.fromInt(value, true));
  }

  /**
   * Returns a Timestamp representing the given number value, provided that it is a finite number. Otherwise, zero is returned.
   *
   * @method
   * @param {number} value the number in question.
   * @return {Timestamp} the timestamp.
   */
  static fromNumber(value) {
    return new Timestamp(Long.fromNumber(value, true));
  }

  /**
   * Returns a Timestamp for the given high and low bits. Each is assumed to use 32 bits.
   *
   * @method
   * @param {number} lowBits the low 32-bits.
   * @param {number} highBits the high 32-bits.
   * @return {Timestamp} the timestamp.
   */
  static fromBits(lowBits, highBits) {
    return new Timestamp(lowBits, highBits);
  }

  /**
   * Returns a Timestamp from the given string, optionally using the given radix.
   *
   * @method
   * @param {String} str the textual representation of the Timestamp.
   * @param {number} [opt_radix] the radix in which the text is written.
   * @return {Timestamp} the timestamp.
   */
  static fromString(str, opt_radix) {
    return new Timestamp(Long.fromString(str, true, opt_radix));
  }

  /**
   * @ignore
   */
  toExtendedJSON(options): any {
    return { $timestamp: { t: this.high >>> 0, i: this.low >>> 0 } };
  }

  /**
   * @ignore
   */
  static fromExtendedJSON(doc) {
    return new Timestamp(doc.$timestamp.i, doc.$timestamp.t);
  }
}

Timestamp.MAX_VALUE = Timestamp.MAX_UNSIGNED_VALUE;
