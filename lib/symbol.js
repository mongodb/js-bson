'use strict';
/**
 * A class representation of the BSON Symbol type.
 */
class Symbol {
  /**
   * Create a Symbol type
   *
   * @param {string} value the string representing the symbol.
   */
  constructor(value) {
    this.value = value;
  }

  /**
   * Access the wrapped string value.
   *
   * @method
   * @return {String} returns the wrapped string.
   */
  valueOf() {
    return this.value;
  }

  /**
   * @ignore
   */
  toString() {
    return this.value;
  }

  /**
   * @ignore
   */
  inspect() {
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
  toExtendedJSON() {
    return { $symbol: this.value };
  }

  /**
   * @ignore
   */
  static fromExtendedJSON(doc) {
    return new Symbol(doc.$symbol);
  }
}

Object.defineProperty(Symbol.prototype, '_bsontype', { value: 'Symbol' });
module.exports = Symbol;
