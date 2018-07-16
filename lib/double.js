'use strict';
/**
 * A class representation of the BSON Double type.
 */
class Double {
  /**
   * Create a Double type
   *
   * @param {number} value the number we want to represent as a double.
   * @return {Double}
   */
  constructor(value) {
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
}

Object.defineProperty(Double.prototype, '_bsontype', { value: 'Double' });
module.exports = Double;
