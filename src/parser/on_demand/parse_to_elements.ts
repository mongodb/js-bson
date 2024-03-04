import { BSONOffsetError } from '../../error';
import { NumberUtils } from '../../utils/number_utils';

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

/**
 * Searches for null terminator.
 * **Does not** bounds check since this should **ONLY** be used within parseToElements which has asserted that `bytes` ends with a `0x00`.
 * So this will at most iterate to the document's terminator and error if that is the offset reached.
 */
function findNull(bytes: Uint8Array, offset: number): number {
  let nullTerminatorOffset = offset;

  for (; bytes[nullTerminatorOffset] !== 0x00; nullTerminatorOffset++);

  if (nullTerminatorOffset === bytes.length - 1) {
    throw new BSONOffsetError('Null terminator not found', offset);
  }

  return nullTerminatorOffset;
}

/**
 * @public
 * @experimental
 */
export function parseToElements(bytes: Uint8Array, startOffset = 0): Iterable<BSONElement> {
  if (bytes.length < 5) {
    throw new BSONOffsetError(
      `Input must be at least 5 bytes, got ${bytes.length} bytes`,
      startOffset
    );
  }

  const documentSize = NumberUtils.getSize(bytes, startOffset);

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

    if (type === 1 || type === 18 || type === 9 || type === 17) {
      // double, long, date, timestamp
      length = 8;
    } else if (type === 16) {
      // int
      length = 4;
    } else if (type === 7) {
      // objectId
      length = 12;
    } else if (type === 19) {
      // decimal128
      length = 16;
    } else if (type === 8) {
      // boolean
      length = 1;
    } else if (type === 10 || type === 6 || type === 127 || type === 255) {
      // null, undefined, maxKey, minKey
      length = 0;
    }
    // Needs a size calculation
    else if (type === 11) {
      // regex
      length = findNull(bytes, findNull(bytes, offset) + 1) + 1 - offset;
    } else if (type === 3 || type === 4 || type === 15) {
      // object, array, code_w_scope
      length = NumberUtils.getSize(bytes, offset);
    } else if (type === 2 || type === 5 || type === 12 || type === 13 || type === 14) {
      // string, binary, dbpointer, code, symbol
      length = NumberUtils.getSize(bytes, offset) + 4;
      if (type === 5) {
        // binary subtype
        length += 1;
      }
      if (type === 12) {
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
