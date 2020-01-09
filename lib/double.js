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
    return { $numberDouble: this.value.toString() };
  }

  /**
   * @ignore
   */
  static fromExtendedJSON(doc, options) {
    return options && options.relaxed
      ? parseFloat(doc.$numberDouble)
      : new Double(parseFloat(doc.$numberDouble));
  }
}

Object.defineProperty(Double.prototype, '_bsontype', { value: 'Double' });
module.exports = Double;
