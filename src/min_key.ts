/**
 * A class representation of the BSON MinKey type.
 */
export class MinKey {
  _bsontype!: 'MinKey';

  /** @internal */
  toExtendedJSON(): { $minKey: 1 } {
    return { $minKey: 1 };
  }

  /** @internal */
  static fromExtendedJSON(): MinKey {
    return new MinKey();
  }
}

Object.defineProperty(MinKey.prototype, '_bsontype', { value: 'MinKey' });
