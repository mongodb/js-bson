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
  constructor() {}
}

Object.defineProperty(MinKey.prototype, '_bsontype', { value: 'MinKey' });
module.exports = MinKey;
