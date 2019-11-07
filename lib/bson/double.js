/**
 * A class representation of the BSON Double type.
 *
 * @class
 * @param {number} value the number we want to represent as a double.
 * @return {Double}
 */
function Double(value) {
  if (!(this instanceof Double)) return new Double(value);

  this.value = value;
}

Object.defineProperty(Double.prototype, '_bsontype', {
  value: 'Double',
  writable: false
});

/**
 * Access the number value.
 *
 * @method
 * @return {number} returns the wrapped double number.
 */
Double.prototype.valueOf = function() {
  return this.value;
};

/**
 * @ignore
 */
Double.prototype.toJSON = function() {
  return this.value;
};

module.exports = Double;
module.exports.Double = Double;
