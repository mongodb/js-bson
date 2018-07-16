'use strict';

/**
 * A class representation of the BSON Code type.
 */
class Code {
  /**
   * Create a Code type
   *
   * @param {(string|function)} code a string or function.
   * @param {Object} [scope] an optional scope for the function.
   * @return {Code}
   */
  constructor(code, scope) {
    this._bsontype = 'Code';
    this.code = code;
    this.scope = scope;
  }

  /**
   * @ignore
   */
  toJSON() {
    return { scope: this.scope, code: this.code };
  }
}

module.exports = Code;
