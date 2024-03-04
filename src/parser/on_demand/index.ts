import { type BSONError, BSONOffsetError } from '../../error';
import { type BSONElement, parseToElements } from './parse_to_elements';
/**
 * @experimental
 * @public
 *
 * A new set of BSON APIs that are currently experimental and not intended for production use.
 */
export type OnDemand = {
  BSONOffsetError: {
    new (message: string, offset: number): BSONOffsetError;
    isBSONError(value: unknown): value is BSONError;
  };
  parseToElements: (this: void, bytes: Uint8Array, startOffset?: number) => Iterable<BSONElement>;
};

/**
 * @experimental
 * @public
 */
const onDemand: OnDemand = Object.create(null);

onDemand.parseToElements = parseToElements;
onDemand.BSONOffsetError = BSONOffsetError;

Object.freeze(onDemand);

export { onDemand };
