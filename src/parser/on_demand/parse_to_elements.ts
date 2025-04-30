import { BSONOffsetError } from '../../error';
import { NumberUtils } from '../../utils/number_utils';

/**
 * @internal
 *
 * @remarks
 * - This enum is const so the code we produce will inline the numbers
 * - `minKey` is set to 255 so unsigned comparisons succeed
 * - Modify with caution, double check the bundle contains literals
 *
 * @example
 * ```ts
 * const BSONElementType = {
 *   double: 1,
 *   string: 2,
 *   object: 3,
 *   array: 4,
 *   binData: 5,
 *   undefined: 6,
 *   objectId: 7,
 *   bool: 8,
 *   date: 9,
 *   null: 10,
 *   regex: 11,
 *   dbPointer: 12,
 *   javascript: 13,
 *   symbol: 14,
 *   javascriptWithScope: 15,
 *   int: 16,
 *   timestamp: 17,
 *   long: 18,
 *   decimal: 19,
 *   minKey: 255,
 *   maxKey: 127
 * } as const;
 * ```
 */

/**
 * @public
 * @experimental
 */
export type BSONElement = [
  type: number,
  nameOffset: number,
  nameLength: number,
  offset: number,
  length: number
];

function getSize(source: Uint8Array, offset: number) {
  try {
    return NumberUtils.getNonnegativeInt32LE(source, offset);
  } catch (cause) {
    throw new BSONOffsetError('BSON size cannot be negative', offset, { cause });
  }
}

/**
 * Searches for null terminator of a BSON element's value (Never the document null terminator)
 * **Does not** bounds check since this should **ONLY** be used within parseToElements which has asserted that `bytes` ends with a `0x00`.
 * So this will at most iterate to the document's terminator and error if that is the offset reached.
 */
function findNull(bytes: Uint8Array, offset: number): number {
  let nullTerminatorOffset = offset;

  for (; bytes[nullTerminatorOffset] !== 0x00; nullTerminatorOffset++);

  if (nullTerminatorOffset === bytes.length - 1) {
    // We reached the null terminator of the document, not a value's
    throw new BSONOffsetError('Null terminator not found', offset);
  }

  return nullTerminatorOffset;
}

/**
 * @public
 * @experimental
 */
export function parseToElements(
  bytes: Uint8Array,
  startOffset: number | null = 0
): Iterable<BSONElement> {
  startOffset ??= 0;

  if (bytes.length < 5) {
    throw new BSONOffsetError(
      `Input must be at least 5 bytes, got ${bytes.length} bytes`,
      startOffset
    );
  }

  const documentSize = getSize(bytes, startOffset);

  if (documentSize > bytes.length - startOffset) {
    throw new BSONOffsetError(
      `Parsed documentSize (${documentSize} bytes) does not match input length (${bytes.length} bytes)`,
      startOffset
    );
  }

  if (bytes[startOffset + documentSize - 1] !== 0x00) {
    throw new BSONOffsetError('BSON documents must end in 0x00', startOffset + documentSize);
  }

  const elements: BSONElement[] = [];
  let offset = startOffset + 4;

  while (offset <= documentSize + startOffset) {
    const type = bytes[offset];
    offset += 1;

    if (type === 0) {
      if (offset - startOffset !== documentSize) {
        throw new BSONOffsetError(`Invalid 0x00 type byte`, offset);
      }
      break;
    }

    const nameOffset = offset;
    const nameLength = findNull(bytes, offset) - nameOffset;
    offset += nameLength + 1;

    let length: number;

    if (
      type === /* double */ 1 ||
      type === /* long */ 18 ||
      type === /* date */ 9 ||
      type === /* timestamp */ 17
    ) {
      length = 8;
    } else if (type === /* int */ 16) {
      length = 4;
    } else if (type === /* objectId */ 7) {
      length = 12;
    } else if (type === /* decimal */ 19) {
      length = 16;
    } else if (type === /* bool */ 8) {
      length = 1;
    } else if (
      type === /* null */ 10 ||
      type === /* undefined */ 6 ||
      type === /* maxKey */ 127 ||
      type === /* minKey */ 255
    ) {
      length = 0;
    }
    // Needs a size calculation
    else if (type === /* regex */ 11) {
      length = findNull(bytes, findNull(bytes, offset) + 1) + 1 - offset;
    } else if (
      type === /* object */ 3 ||
      type === /* array */ 4 ||
      type === /* javascriptWithScope */ 15
    ) {
      length = getSize(bytes, offset);
    } else if (
      type === /* string */ 2 ||
      type === /* binData */ 5 ||
      type === /* dbPointer */ 12 ||
      type === /* javascript */ 13 ||
      type === /* symbol */ 14
    ) {
      length = getSize(bytes, offset) + 4;
      if (type === /* binData */ 5) {
        // binary subtype
        length += 1;
      }
      if (type === /* dbPointer */ 12) {
        // dbPointer's objectId
        length += 12;
      }
    } else {
      throw new BSONOffsetError(
        `Invalid 0x${type.toString(16).padStart(2, '0')} type byte`,
        offset
      );
    }

    if (length > documentSize) {
      throw new BSONOffsetError('value reports length larger than document', offset);
    }

    elements.push([type, nameOffset, nameLength, offset, length]);
    offset += length;
  }

  return elements;
}
