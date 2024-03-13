import { type Code } from '../../code';
import { type BSONElement, getSize, parseToElements } from './parse_to_elements';

/** @internal */
const DEFAULT_REVIVER: BSONReviver = (
  _bytes: Uint8Array,
  _container: Container,
  _element: BSONElement
) => null;

/** @internal */
function parseToElementsToArray(bytes: Uint8Array, offset?: number | null): BSONElement[] {
  const res = parseToElements(bytes, offset);
  return Array.isArray(res) ? res : [...res];
}

/** @internal */
type ParseContext = {
  elementOffset: number;
  elements: BSONElement[];
  container: Container;
  previous: ParseContext | null;
};

/**
 * @experimental
 * @public
 * A union of the possible containers for BSON elements.
 *
 * Depending on kind, a reviver can accurately assign a value to a name on the container.
 */
export type Container =
  | {
      dest: Record<string, unknown>;
      kind: 'object';
    }
  | {
      dest: Map<string, unknown>;
      kind: 'map';
    }
  | {
      dest: Array<unknown>;
      kind: 'array';
    }
  | {
      dest: Code;
      kind: 'code';
    }
  | {
      kind: 'custom';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dest: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };

/**
 * @experimental
 * @public
 */
export type BSONReviver = (
  bytes: Uint8Array,
  container: Container,
  element: BSONElement
) => Container | null;

/**
 * @experimental
 * @public
 */
export function parseToStructure<
  TRoot extends Container = {
    dest: Record<string, unknown>;
    kind: 'object';
  }
>(
  bytes: Uint8Array,
  startOffset?: number | null,
  pRoot?: TRoot | null,
  pReviver?: BSONReviver | null
): TRoot extends undefined ? Record<string, unknown> : TRoot['dest'] {
  const root = pRoot ?? {
    kind: 'object',
    dest: Object.create(null) as Record<string, unknown>
  };

  const reviver = pReviver ?? DEFAULT_REVIVER;

  let ctx: ParseContext | null = {
    elementOffset: 0,
    elements: parseToElementsToArray(bytes, startOffset),
    container: root,
    previous: null
  };

  /** BSONElement offsets: type indicator and value offset */
  const enum BSONElementOffset {
    type = 0,
    offset = 3
  }

  /** BSON Embedded types */
  const enum BSONElementType {
    object = 3,
    array = 4,
    javascriptWithScope = 15
  }

  embedded: while (ctx !== null) {
    for (
      let bsonElement: BSONElement | undefined = ctx.elements[ctx.elementOffset++];
      bsonElement != null;
      bsonElement = ctx.elements[ctx.elementOffset++]
    ) {
      const type = bsonElement[BSONElementOffset.type];
      const offset = bsonElement[BSONElementOffset.offset];

      const container = reviver(bytes, ctx.container, bsonElement);
      const isEmbeddedType =
        type === BSONElementType.object ||
        type === BSONElementType.array ||
        type === BSONElementType.javascriptWithScope;

      if (container != null && isEmbeddedType) {
        const docOffset: number =
          type !== BSONElementType.javascriptWithScope
            ? offset
            : // value offset + codeSize + value int + code int
              offset + getSize(bytes, offset + 4) + 4 + 4;

        ctx = {
          elementOffset: 0,
          elements: parseToElementsToArray(bytes, docOffset),
          container,
          previous: ctx
        };

        continue embedded;
      }
    }
    ctx = ctx.previous;
  }

  return root.dest;
}
