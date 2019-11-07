/**
 * A class representation of the BSON MinKey type.
 *
 * @class
 * @return {MinKey} A MinKey instance
 */
function MinKey() {
  if (!(this instanceof MinKey)) return new MinKey();
}

Object.defineProperty(MinKey.prototype, '_bsontype', {
  value: 'MinKey',
  writable: false
});

module.exports = MinKey;
module.exports.MinKey = MinKey;
