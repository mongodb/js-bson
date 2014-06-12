/**
 * A class representation of the BSON MinKey type.
 *
 * @class Represents the BSON MinKey type.
 * @return {MinKey}
 */
function MinKey() {
  if(!(this instanceof MinKey)) return new MinKey();

  this._bsontype = 'MinKey';
}

MinKey.prototype.toJSON = function(){
  return {'$minKey' : 1};
};


exports.MinKey = MinKey;
