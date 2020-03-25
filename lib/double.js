'use strict';

/**
 * A class representation of the BSON Double type.
 */
class Double {
  /**
   * Create a Double type
   *
   * @param {number|Number} value the number we want to represent as a double.
   * @return {Double}
   */
  constructor(value) {
    if (value instanceof Number) {
      value = value.valueOf();
    }

    this.value = value;
  }

  /**
   * Access the number value.
   *
   * @method
   * @return {number} returns the wrapped double number.
   */
  valueOf() {
    return this.value;
  }

  /**
   * @ignore
   */
  toJSON() {
    return this.value;
  }

  /**
   * @ignore
   */
  toExtendedJSON(options) {
    if (options && (options.legacy || (options.relaxed && isFinite(this.value)))) {
      return this.value;
    }

    // NOTE: JavaScript has +0 and -0, apparently to model limit calculations. If a user
    // explicitly provided `-0` then we need to ensure the sign makes it into the output
    if (Object.is(Math.sign(this.value), -0)) {
      return { $numberDouble: `-${this.value.toFixed(1)}` };
    }

    return {
      $numberDouble: Number.isInteger(this.value) ? this.value.toFixed(1) : this.value.toString()
    };
  }

  /**
   * @ignore
   */
  static fromExtendedJSON(doc, options) {
    const doubleValue = parseFloat(doc.$numberDouble);
    return options && options.relaxed ? doubleValue : new Double(doubleValue);
  }
}

Object.defineProperty(Double.prototype, '_bsontype', { value: 'Double' });
module.exports = Double;
