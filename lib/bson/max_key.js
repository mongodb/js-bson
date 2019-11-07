/**
 * A class representation of the BSON MaxKey type.
 *
 * @class
 * @return {MaxKey} A MaxKey instance
 */
function MaxKey() {
  if (!(this instanceof MaxKey)) return new MaxKey();
}

Object.defineProperty(MaxKey.prototype, '_bsontype', {
  value: 'MaxKey',
  writable: false
});

module.exports = MaxKey;
module.exports.MaxKey = MaxKey;
