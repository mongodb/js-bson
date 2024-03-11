import { type Code } from '../../code';
import { type BSONElement, getSize, parseToElements as p } from './parse_to_elements';

/** @internal TODO */
const DEFAULT_REVIVER = () => null;

/** @internal */
function parseToElements(...args: Parameters<typeof p>): BSONElement[] {
  const res = p(...args);
  return Array.isArray(res) ? res : [...res];
}

/**
 * @internal
 * BSONElement offsets
 */
const enum e {
  type = 0,
  nameOffset = 1,
  nameLength = 2,
  offset = 3,
  length = 4
}

/**
 * @internal
 * Embedded bson types
 */
const enum t {
  object = 3,
  array = 4,
  javascriptWithScope = 15
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
  startOffset?: number,
  providedRoot?: TRoot,
  reviver?: BSONReviver
): TRoot extends undefined ? Record<string, unknown> : TRoot['dest'] {
  const root = providedRoot ?? {
    kind: 'object',
    dest: Object.create(null) as Record<string, unknown>
  };

  reviver ??= DEFAULT_REVIVER;

  let ctx: ParseContext | null = {
    elementOffset: 0,
    elements: parseToElements(bytes, startOffset),
    container: root,
    previous: null
  };

  embedded: while (ctx !== null) {
    for (
      let it: BSONElement | undefined = ctx.elements[ctx.elementOffset++];
      it != null;
      it = ctx.elements[ctx.elementOffset++]
    ) {
      const maybeNewContainer = reviver(bytes, ctx.container, it);
      const isEmbeddedType =
        it[e.type] === t.object || it[e.type] === t.array || it[e.type] === t.javascriptWithScope;
      const iterateEmbedded = maybeNewContainer != null && isEmbeddedType;

      if (iterateEmbedded) {
        const docOffset: number =
          it[e.type] !== t.javascriptWithScope
            ? it[e.offset]
            : it[e.offset] + getSize(bytes, it[e.offset] + 4) + 4 + 4; // value offset + codeSize + value int + code int

        ctx = {
          elementOffset: 0,
          elements: parseToElements(bytes, docOffset),
          container: maybeNewContainer,
          previous: ctx
        };

        continue embedded;
      }
    }
    ctx = ctx.previous;
  }

  return root.dest;
}
