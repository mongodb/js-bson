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
  constructor() {}
}

Object.defineProperty(MaxKey.prototype, '_bsontype', { value: 'MaxKey' });
module.exports = MaxKey;
