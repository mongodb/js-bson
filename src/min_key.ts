/** @public */
export interface MinKeyExtended {
  $minKey: 1;
}

/**
 * A class representation of the BSON MinKey type.
 * @public
 */
export class MinKey {
  _bsontype!: 'MinKey';

  /** @internal */
  toExtendedJSON(): MinKeyExtended {
    return { $minKey: 1 };
  }

  /** @internal */
  static fromExtendedJSON(): MinKey {
    return new MinKey();
  }

  /** @internal */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.inspect();
  }

  inspect(): string {
    return 'MinKey()';
  }
}

Object.defineProperty(MinKey.prototype, '_bsontype', { value: 'MinKey' });
