import { BSON_MAJOR_VERSION } from './constants';
import { type InspectParameterFn } from './parser/utils';

/** @public */
export abstract class BSONValue {
  /** @public */
  public abstract get _bsontype(): string;

  /** @internal */
  get [Symbol.for('@@mdb.bson.version')](): typeof BSON_MAJOR_VERSION {
    return BSON_MAJOR_VERSION;
  }

  [Symbol.for('nodejs.util.inspect.custom')](
    depth?: number,
    options?: unknown,
    inspect?: InspectParameterFn
  ): string {
    return this.inspect(depth, options, inspect);
  }

  /** @public */
  public abstract inspect(depth?: number, options?: unknown, inspect?: InspectParameterFn): string;

  /** @internal */
  abstract toExtendedJSON(): unknown;
}
