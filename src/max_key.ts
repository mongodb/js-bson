import { BSON_MAJOR_VERSION } from './constants';

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
  get [Symbol.for('@@mdb.bson.version')](): BSON_MAJOR_VERSION {
    return BSON_MAJOR_VERSION;
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
