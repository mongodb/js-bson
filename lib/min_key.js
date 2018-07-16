'use strict';
/**
 * A class representation of the BSON MinKey type.
 */
class MinKey {
  /**
   * Create a MinKey type
   *
   * @return {MinKey} A MinKey instance
   */
  constructor() {
    this._bsontype = 'MinKey';
  }
}

module.exports = MinKey;
