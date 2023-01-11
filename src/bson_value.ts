import { BSON_MAJOR_VERSION } from './constants';

/** @public */
export abstract class BSONValue {
  abstract get _bsontype(): string;

  /** @internal */
  get [Symbol.for('@@mdb.bson.version')](): BSON_MAJOR_VERSION {
    return BSON_MAJOR_VERSION;
  }
}
