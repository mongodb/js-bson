/**
 * A class representation of the BSON MinKey type.
 *
 * @class Represents the BSON MinKey type.
 * @return {MinKey}
 */
function MinKey() {
  this._bsontype = 'MinKey';
}

if(typeof window === 'undefined') {
  exports.MinKey = MinKey;
}