/**
 * A class representation of the BSON Code type.
 *
 * @class
 * @param {(string|function)} code a string or function.
 * @param {Object} [scope] an optional scope for the function.
 * @return {Code}
 */
var Code = function Code(code, scope) {
  if (!(this instanceof Code)) return new Code(code, scope);
  this.code = code;
  this.scope = scope;
};

Object.defineProperty(Code.prototype, '_bsontype', {
  value: 'Code',
  writable: false
});

/**
 * @ignore
 */
Code.prototype.toJSON = function() {
  return { scope: this.scope, code: this.code };
};

module.exports = Code;
module.exports.Code = Code;
