/**
 * A class representation of the BSON MaxKey type.
 */
export class MaxKey {
  /**
   * @ignore
   */
  toExtendedJSON() {
    return { $maxKey: 1 };
  }

  /**
   * @ignore
   */
  static fromExtendedJSON() {
    return new MaxKey();
  }
}

Object.defineProperty(MaxKey.prototype, '_bsontype', { value: 'MaxKey' });
