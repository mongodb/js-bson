/** @public */
export interface MaxKeyExtended {
  $maxKey: 1;
}

/**
 * A class representation of the BSON MaxKey type.
 * @public
 * @category BSONType
 */
export class MaxKey {
  get _bsontype(): 'MaxKey' {
    return 'MaxKey';
  }
  /** @internal */
  get [Symbol.for('@@mdb.bson.version')](): 5 {
    return 5;
  }

  /** @internal */
  toExtendedJSON(): MaxKeyExtended {
    return { $maxKey: 1 };
  }

  /** @internal */
  static fromExtendedJSON(): MaxKey {
    return new MaxKey();
  }

  /** @internal */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.inspect();
  }

  inspect(): string {
    return 'new MaxKey()';
  }
}
