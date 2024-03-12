import { type BSONError, BSONOffsetError } from '../../error';
import { type BSONElement, parseToElements } from './parse_to_elements';
import { type BSONReviver, type Container, parseToStructure } from './parse_to_structure';
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
  parseToStructure: <
    TRoot extends Container = {
      dest: Record<string, unknown>;
      kind: 'object';
    }
  >(
    bytes: Uint8Array,
    startOffset?: number,
    root?: TRoot,
    reviver?: BSONReviver
  ) => TRoot extends undefined ? Record<string, unknown> : TRoot['dest'];
  // Types
  BSONElement: BSONElement;
  Container: Container;
  BSONReviver: BSONReviver;
};

/**
 * @experimental
 * @public
 */
const onDemand: OnDemand = Object.create(null);

onDemand.parseToElements = parseToElements;
onDemand.parseToStructure = parseToStructure;
onDemand.BSONOffsetError = BSONOffsetError;

Object.freeze(onDemand);

export { onDemand };
