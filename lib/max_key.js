'use strict';
/**
 * A class representation of the BSON MaxKey type.
 */
class MaxKey {
  /**
   * Create a MaxKey type
   *
   * @return {MaxKey} A MaxKey instance
   */
  constructor() {
    this._bsontype = 'MaxKey';
  }
}

module.exports = MaxKey;
