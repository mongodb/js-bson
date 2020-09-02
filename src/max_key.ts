/**
 * A class representation of the BSON MaxKey type.
 */
export class MaxKey {
  _bsontype!: 'MaxKey';

  /** @internal */
  toExtendedJSON(): { $maxKey: 1 } {
    return { $maxKey: 1 };
  }

  /** @internal */
  static fromExtendedJSON(): MaxKey {
    return new MaxKey();
  }
}

Object.defineProperty(MaxKey.prototype, '_bsontype', { value: 'MaxKey' });
