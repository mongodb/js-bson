import { Binary, validateBinaryVector } from '../binary';
import type { BSONSymbol, DBRef, Document, MaxKey } from '../bson';
import { bsonType } from '../bson_value';
import type { Code } from '../code';
import * as constants from '../constants';
import type { Decimal128 } from '../decimal128';
import type { Double } from '../double';
import { BSONError, BSONVersionError } from '../error';
import type { Int32 } from '../int_32';
import { Long } from '../long';
import type { MinKey } from '../min_key';
import type { ObjectId } from '../objectid';
import type { BSONRegExp } from '../regexp';
import { ByteUtils } from '../utils/byte_utils';
import { NumberUtils } from '../utils/number_utils';
import { isAnyArrayBuffer, isDate, isMap, isRegExp, isUint8Array } from './utils';

/** @public */
export interface SerializeOptions {
  /**
   * the serializer will check if keys are valid.
   * @defaultValue `false`
   */
  checkKeys?: boolean;
  /**
   * serialize the javascript functions
   * @defaultValue `false`
   */
  serializeFunctions?: boolean;
  /**
   * serialize will not emit undefined fields
   * note that the driver sets this to `false`
   * @defaultValue `true`
   */
  ignoreUndefined?: boolean;
  /** @internal Resize internal buffer */
  minInternalBufferSize?: number;
  /**
   * the index in the buffer where we wish to start serializing into
   * @defaultValue `0`
   */
  index?: number;
}

const regexp = /\x00/; // eslint-disable-line no-control-regex
const ignoreKeys = new Set(['$db', '$ref', '$id', '$clusterTime']);

function serializeString(buffer: Uint8Array, key: string, value: string, index: number) {
  // Encode String type
  buffer[index++] = constants.BSON_DATA_STRING;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index = index + numberOfWrittenBytes + 1;
  buffer[index - 1] = 0;
  // Write the string
  const size = ByteUtils.encodeUTF8Into(buffer, value, index + 4);
  // Write the size of the string to buffer
  NumberUtils.setInt32LE(buffer, index, size + 1);
  // Update index
  index = index + 4 + size;
  // Write zero
  buffer[index++] = 0;
  return index;
}

function serializeNumber(buffer: Uint8Array, key: string, value: number, index: number) {
  const isNegativeZero = Object.is(value, -0);

  const type =
    !isNegativeZero &&
    Number.isSafeInteger(value) &&
    value <= constants.BSON_INT32_MAX &&
    value >= constants.BSON_INT32_MIN
      ? constants.BSON_DATA_INT
      : constants.BSON_DATA_NUMBER;

  buffer[index++] = type;

  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0x00;

  if (type === constants.BSON_DATA_INT) {
    index += NumberUtils.setInt32LE(buffer, index, value);
  } else {
    index += NumberUtils.setFloat64LE(buffer, index, value);
  }

  return index;
}

function serializeBigInt(buffer: Uint8Array, key: string, value: bigint, index: number) {
  buffer[index++] = constants.BSON_DATA_LONG;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index += numberOfWrittenBytes;
  buffer[index++] = 0;

  index += NumberUtils.setBigInt64LE(buffer, index, value);

  return index;
}

function serializeNull(buffer: Uint8Array, key: string, _: unknown, index: number) {
  // Set long type
  buffer[index++] = constants.BSON_DATA_NULL;

  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);

  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  return index;
}

function serializeBoolean(buffer: Uint8Array, key: string, value: boolean, index: number) {
  // Write the type
  buffer[index++] = constants.BSON_DATA_BOOLEAN;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Encode the boolean value
  buffer[index++] = value ? 1 : 0;
  return index;
}

function serializeDate(buffer: Uint8Array, key: string, value: Date, index: number) {
  // Write the type
  buffer[index++] = constants.BSON_DATA_DATE;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;

  // Write the date
  const dateInMilis = Long.fromNumber(value.getTime());
  const lowBits = dateInMilis.getLowBits();
  const highBits = dateInMilis.getHighBits();
  // Encode low bits
  index += NumberUtils.setInt32LE(buffer, index, lowBits);
  // Encode high bits
  index += NumberUtils.setInt32LE(buffer, index, highBits);
  return index;
}

function serializeRegExp(buffer: Uint8Array, key: string, value: RegExp, index: number) {
  // Write the type
  buffer[index++] = constants.BSON_DATA_REGEXP;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);

  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  if (value.source && value.source.match(regexp) != null) {
    throw new BSONError('value ' + value.source + ' must not contain null bytes');
  }
  // Adjust the index
  index = index + ByteUtils.encodeUTF8Into(buffer, value.source, index);
  // Write zero
  buffer[index++] = 0x00;
  // Write the parameters
  if (value.ignoreCase) buffer[index++] = 0x69; // i
  if (value.global) buffer[index++] = 0x73; // s
  if (value.multiline) buffer[index++] = 0x6d; // m

  // Add ending zero
  buffer[index++] = 0x00;
  return index;
}

function serializeBSONRegExp(buffer: Uint8Array, key: string, value: BSONRegExp, index: number) {
  // Write the type
  buffer[index++] = constants.BSON_DATA_REGEXP;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;

  // Check the pattern for 0 bytes
  if (value.pattern.match(regexp) != null) {
    // The BSON spec doesn't allow keys with null bytes because keys are
    // null-terminated.
    throw new BSONError('pattern ' + value.pattern + ' must not contain null bytes');
  }

  // Adjust the index
  index = index + ByteUtils.encodeUTF8Into(buffer, value.pattern, index);
  // Write zero
  buffer[index++] = 0x00;
  // Write the options
  const sortedOptions = value.options.split('').sort().join('');
  index = index + ByteUtils.encodeUTF8Into(buffer, sortedOptions, index);
  // Add ending zero
  buffer[index++] = 0x00;
  return index;
}

function serializeMinMax(buffer: Uint8Array, key: string, value: MinKey | MaxKey, index: number) {
  // Write the type of either min or max key
  if (value === null) {
    buffer[index++] = constants.BSON_DATA_NULL;
  } else if (value[bsonType] === 'MinKey') {
    buffer[index++] = constants.BSON_DATA_MIN_KEY;
  } else {
    buffer[index++] = constants.BSON_DATA_MAX_KEY;
  }

  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  return index;
}

function serializeObjectId(buffer: Uint8Array, key: string, value: ObjectId, index: number) {
  // Write the type
  buffer[index++] = constants.BSON_DATA_OID;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);

  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;

  index += value.serializeInto(buffer, index);

  // Adjust index
  return index;
}

function serializeBuffer(buffer: Uint8Array, key: string, value: Uint8Array, index: number) {
  // Write the type
  buffer[index++] = constants.BSON_DATA_BINARY;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Get size of the buffer (current write point)
  const size = value.length;
  // Write the size of the string to buffer
  index += NumberUtils.setInt32LE(buffer, index, size);
  // Write the default subtype
  buffer[index++] = constants.BSON_BINARY_SUBTYPE_DEFAULT;
  // Copy the content form the binary field to the buffer
  if (size <= 16) {
    for (let i = 0; i < size; i++) buffer[index + i] = value[i];
  } else {
    buffer.set(value, index);
  }
  // Adjust the index
  index = index + size;
  return index;
}

function serializeDecimal128(buffer: Uint8Array, key: string, value: Decimal128, index: number) {
  buffer[index++] = constants.BSON_DATA_DECIMAL128;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Write the data from the value
  for (let i = 0; i < 16; i++) buffer[index + i] = value.bytes[i];
  return index + 16;
}

function serializeLong(buffer: Uint8Array, key: string, value: Long, index: number) {
  // Write the type
  buffer[index++] =
    value[bsonType] === 'Long' ? constants.BSON_DATA_LONG : constants.BSON_DATA_TIMESTAMP;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Write the date
  const lowBits = value.getLowBits();
  const highBits = value.getHighBits();
  // Encode low bits
  index += NumberUtils.setInt32LE(buffer, index, lowBits);
  // Encode high bits
  index += NumberUtils.setInt32LE(buffer, index, highBits);
  return index;
}

function serializeInt32(buffer: Uint8Array, key: string, value: Int32 | number, index: number) {
  value = value.valueOf();
  // Set int type 32 bits or less
  buffer[index++] = constants.BSON_DATA_INT;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Write the int value
  index += NumberUtils.setInt32LE(buffer, index, value);
  return index;
}

function serializeDouble(buffer: Uint8Array, key: string, value: Double, index: number) {
  // Encode as double
  buffer[index++] = constants.BSON_DATA_NUMBER;

  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);

  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;

  // Write float
  index += NumberUtils.setFloat64LE(buffer, index, value.value);

  return index;
}

function serializeFunction(buffer: Uint8Array, key: string, value: Function, index: number) {
  buffer[index++] = constants.BSON_DATA_CODE;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Function string
  const functionString = value.toString();

  // Write the string
  const size = ByteUtils.encodeUTF8Into(buffer, functionString, index + 4) + 1;
  // Write the size of the string to buffer
  NumberUtils.setInt32LE(buffer, index, size);
  // Update index
  index = index + 4 + size - 1;
  // Write zero
  buffer[index++] = 0;
  return index;
}

function serializeBinary(buffer: Uint8Array, key: string, value: Binary, index: number) {
  // Write the type
  buffer[index++] = constants.BSON_DATA_BINARY;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Extract the buffer
  const data = value.buffer;
  // Calculate size
  let size = value.position;
  // Add the deprecated 02 type 4 bytes of size to total
  if (value.sub_type === Binary.SUBTYPE_BYTE_ARRAY) size = size + 4;
  // Write the size of the string to buffer
  index += NumberUtils.setInt32LE(buffer, index, size);
  // Write the subtype to the buffer
  buffer[index++] = value.sub_type;

  // If we have binary type 2 the 4 first bytes are the size
  if (value.sub_type === Binary.SUBTYPE_BYTE_ARRAY) {
    size = size - 4;
    index += NumberUtils.setInt32LE(buffer, index, size);
  }

  if (value.sub_type === Binary.SUBTYPE_VECTOR) {
    validateBinaryVector(value);
  }

  if (size <= 16) {
    for (let i = 0; i < size; i++) buffer[index + i] = data[i];
  } else {
    buffer.set(data, index);
  }
  // Adjust the index
  index = index + value.position;
  return index;
}

function serializeSymbol(buffer: Uint8Array, key: string, value: BSONSymbol, index: number) {
  // Write the type
  buffer[index++] = constants.BSON_DATA_SYMBOL;
  // Number of written bytes
  const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer, key, index);
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Write the string
  const size = ByteUtils.encodeUTF8Into(buffer, value.value, index + 4) + 1;
  // Write the size of the string to buffer
  NumberUtils.setInt32LE(buffer, index, size);
  // Update index
  index = index + 4 + size - 1;
  // Write zero
  buffer[index++] = 0;
  return index;
}

interface SerializationFrame {
  /** Original object passed to this frame — used for cycle-detection (path.delete). */
  sourceObject: Document;
  /** True when serializing a BSON array; affects key format and type byte. */
  isArray: boolean;
  /** Buffer offset where this object's 4-byte size field will be written. */
  objectSizeIndex: number;
  /** Buffer offset for code-with-scope wrapper size, or null if not applicable. */
  codeSizeIndex: number | null;
  /**
   * Object being iterated. For plain objects this may be the toBSON() result of
   * sourceObject; for arrays and Maps it equals sourceObject.
   */
  iterTarget: Document;
  /**
   * Pre-computed Object.keys() of iterTarget for plain objects.
   * Null for arrays (use keyIndex as numeric index) and Maps (use mapIterator).
   */
  keys: string[] | null;
  /** Next index into keys[] for plain objects, or next array index for arrays. */
  keyIndex: number;
  /** Active iterator for Map objects; null for arrays and plain objects. */
  mapIterator: IterableIterator<[unknown, unknown]> | null;
  /** The enclosing frame, or null at the root. The stack is a linked list via this field. */
  prev: SerializationFrame | null;
  /** Whether to validate keys for this frame's document (may differ from caller, e.g. DBRef uses false). */
  checkKeys: boolean;
  /** Whether undefined values are skipped (may differ from caller, e.g. DBRef uses true). */
  ignoreUndefined: boolean;
}

function makeFrame(
  sourceObject: Document,
  objectSizeIndex: number,
  codeSizeIndex: number | null,
  prev: SerializationFrame | null,
  checkKeys: boolean,
  ignoreUndefined: boolean
): SerializationFrame {
  if (Array.isArray(sourceObject)) {
    return {
      sourceObject,
      isArray: true,
      objectSizeIndex,
      codeSizeIndex,
      iterTarget: sourceObject,
      keys: null,
      keyIndex: 0,
      mapIterator: null,
      prev,
      checkKeys,
      ignoreUndefined
    };
  }
  if (sourceObject instanceof Map || isMap(sourceObject)) {
    return {
      sourceObject,
      isArray: false,
      objectSizeIndex,
      codeSizeIndex,
      iterTarget: sourceObject,
      keys: null,
      keyIndex: 0,
      mapIterator: (sourceObject as Map<unknown, unknown>).entries(),
      prev,
      checkKeys,
      ignoreUndefined
    };
  }
  // Plain object: call toBSON() if defined to obtain the object to iterate.
  let target: Document = sourceObject;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (target as any)?.toBSON === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target = (target as any).toBSON() as Document;
    if (target != null && typeof target !== 'object') {
      throw new BSONError('toBSON function did not return an object');
    }
  }
  return {
    sourceObject,
    isArray: false,
    objectSizeIndex,
    codeSizeIndex,
    iterTarget: target,
    keys: Object.keys(target as object),
    keyIndex: 0,
    mapIterator: null,
    prev,
    checkKeys,
    ignoreUndefined
  };
}

export function serializeInto(
  buffer: Uint8Array,
  object: Document,
  checkKeys: boolean,
  startingIndex: number,
  serializeFunctions: boolean,
  ignoreUndefined: boolean,
  path: Set<Document> | null
): number {
  if (path == null) {
    // We are at the root input
    if (object == null) {
      // ONLY the root should turn into an empty document
      // BSON Empty document has a size of 5 (LE)
      buffer[0] = 0x05;
      buffer[1] = 0x00;
      buffer[2] = 0x00;
      buffer[3] = 0x00;
      // All documents end with null terminator
      buffer[4] = 0x00;
      return 5;
    }

    if (Array.isArray(object)) {
      throw new BSONError('serialize does not support an array as the root input');
    }
    if (typeof object !== 'object') {
      throw new BSONError('serialize does not support non-object as the root input');
    } else if ('_bsontype' in object && typeof object._bsontype === 'string') {
      throw new BSONError(`BSON types cannot be serialized as a document`);
    } else if (
      isDate(object) ||
      isRegExp(object) ||
      isUint8Array(object) ||
      isAnyArrayBuffer(object)
    ) {
      throw new BSONError(`date, regexp, typedarray, and arraybuffer cannot be BSON documents`);
    }

    path = new Set();
  }

  path.add(object);

  let currentFrame: SerializationFrame | null = makeFrame(
    object,
    startingIndex,
    null,
    null,
    checkKeys,
    ignoreUndefined
  );
  let index = startingIndex + 4;

  while (currentFrame !== null) {
    const frame: SerializationFrame = currentFrame;

    // Advance to the next key-value pair, or finalize the frame if exhausted.
    let key: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any;
    if (frame.mapIterator !== null) {
      const next = frame.mapIterator.next();
      if (next.done) {
        buffer[index++] = 0x00;
        NumberUtils.setInt32LE(buffer, frame.objectSizeIndex, index - frame.objectSizeIndex);
        if (frame.codeSizeIndex !== null) {
          NumberUtils.setInt32LE(buffer, frame.codeSizeIndex, index - frame.codeSizeIndex);
        }
        path.delete(frame.sourceObject);
        currentFrame = frame.prev;
        continue;
      }
      key = next.value[0] as string;
      value = next.value[1];
    } else if (frame.keys !== null) {
      if (frame.keyIndex >= frame.keys.length) {
        buffer[index++] = 0x00;
        NumberUtils.setInt32LE(buffer, frame.objectSizeIndex, index - frame.objectSizeIndex);
        if (frame.codeSizeIndex !== null) {
          NumberUtils.setInt32LE(buffer, frame.codeSizeIndex, index - frame.codeSizeIndex);
        }
        path.delete(frame.sourceObject);
        currentFrame = frame.prev;
        continue;
      }
      key = frame.keys[frame.keyIndex++];
      value = (frame.iterTarget as Record<string, unknown>)[key];
    } else {
      // Array: use keyIndex as the numeric index.
      const arr = frame.iterTarget as unknown[];
      if (frame.keyIndex >= arr.length) {
        buffer[index++] = 0x00;
        NumberUtils.setInt32LE(buffer, frame.objectSizeIndex, index - frame.objectSizeIndex);
        if (frame.codeSizeIndex !== null) {
          NumberUtils.setInt32LE(buffer, frame.codeSizeIndex, index - frame.codeSizeIndex);
        }
        path.delete(frame.sourceObject);
        currentFrame = frame.prev;
        continue;
      }
      const i = frame.keyIndex++;
      key = String(i);
      value = arr[i];
    }

    if (typeof value?.toBSON === 'function') {
      value = value.toBSON();
    }

    if (!frame.isArray && typeof key === 'string' && !(key[0] === '$' && ignoreKeys.has(key))) {
      if (regexp.test(key)) {
        throw new BSONError('key ' + key + ' must not contain null bytes');
      }
      if (frame.checkKeys) {
        if ('$' === key[0]) {
          throw new BSONError('key ' + key + " must not start with '$'");
        } else if (key.includes('.')) {
          throw new BSONError('key ' + key + " must not contain '.'");
        }
      }
    }

    const type = typeof value;

    if (value === undefined) {
      if (frame.isArray || frame.ignoreUndefined === false) {
        index = serializeNull(buffer, key, value, index);
      }
    } else if (value === null) {
      index = serializeNull(buffer, key, value, index);
    } else if (type === 'string') {
      index = serializeString(buffer, key, value, index);
    } else if (type === 'number') {
      index = serializeNumber(buffer, key, value, index);
    } else if (type === 'bigint') {
      index = serializeBigInt(buffer, key, value, index);
    } else if (type === 'boolean') {
      index = serializeBoolean(buffer, key, value, index);
    } else if (type === 'object' && value._bsontype == null) {
      if (value instanceof Date || isDate(value)) {
        index = serializeDate(buffer, key, value, index);
      } else if (value instanceof Uint8Array || isUint8Array(value)) {
        index = serializeBuffer(buffer, key, value, index);
      } else if (value instanceof RegExp || isRegExp(value)) {
        index = serializeRegExp(buffer, key, value, index);
      } else {
        if (path.has(value)) {
          throw new BSONError('Cannot convert circular structure to BSON');
        }
        const nestedIsArray = Array.isArray(value);
        buffer[index++] = nestedIsArray ? constants.BSON_DATA_ARRAY : constants.BSON_DATA_OBJECT;
        index += ByteUtils.encodeUTF8Into(buffer, key, index);
        buffer[index++] = 0x00;
        const nestedStartIndex = index;
        path.add(value);
        currentFrame = makeFrame(
          value,
          nestedStartIndex,
          null,
          frame,
          frame.checkKeys,
          frame.ignoreUndefined
        );
        index += 4;
      }
    } else if (type === 'object') {
      if (value[constants.BSON_VERSION_SYMBOL] !== constants.BSON_MAJOR_VERSION) {
        throw new BSONVersionError();
      }
      const tag = value[bsonType];
      if (tag === 'ObjectId') {
        index = serializeObjectId(buffer, key, value, index);
      } else if (tag === 'Decimal128') {
        index = serializeDecimal128(buffer, key, value, index);
      } else if (tag === 'Long' || tag === 'Timestamp') {
        index = serializeLong(buffer, key, value, index);
      } else if (tag === 'Double') {
        index = serializeDouble(buffer, key, value, index);
      } else if (tag === 'Code') {
        const codeValue = value as Code;
        if (codeValue.scope && typeof codeValue.scope === 'object') {
          buffer[index++] = constants.BSON_DATA_CODE_W_SCOPE;
          index += ByteUtils.encodeUTF8Into(buffer, key, index);
          buffer[index++] = 0x00;
          const codeTotalSizeIndex = index;
          index += 4;
          const functionString = codeValue.code;
          const codeSize = ByteUtils.encodeUTF8Into(buffer, functionString, index + 4) + 1;
          NumberUtils.setInt32LE(buffer, index, codeSize);
          buffer[index + 4 + codeSize - 1] = 0;
          index = index + codeSize + 4;
          const scope = codeValue.scope;
          if (path.has(scope)) {
            throw new BSONError('Cannot convert circular structure to BSON');
          }
          path.add(scope);
          currentFrame = makeFrame(
            scope,
            index,
            codeTotalSizeIndex,
            frame,
            frame.checkKeys,
            frame.ignoreUndefined
          );
          index += 4;
        } else {
          buffer[index++] = constants.BSON_DATA_CODE;
          index += ByteUtils.encodeUTF8Into(buffer, key, index);
          buffer[index++] = 0x00;
          const functionString = codeValue.code.toString();
          const size = ByteUtils.encodeUTF8Into(buffer, functionString, index + 4) + 1;
          NumberUtils.setInt32LE(buffer, index, size);
          index = index + 4 + size - 1;
          buffer[index++] = 0;
        }
      } else if (tag === 'Binary') {
        index = serializeBinary(buffer, key, value, index);
      } else if (tag === 'BSONSymbol') {
        index = serializeSymbol(buffer, key, value, index);
      } else if (tag === 'DBRef') {
        const dbref = value as DBRef;
        const orderedValues: Document = Object.assign(
          { $ref: dbref.collection, $id: dbref.oid },
          dbref.db != null ? { $db: dbref.db } : null,
          dbref.fields
        );
        buffer[index++] = constants.BSON_DATA_OBJECT;
        index += ByteUtils.encodeUTF8Into(buffer, key, index);
        buffer[index++] = 0x00;
        path.add(orderedValues);
        currentFrame = makeFrame(orderedValues, index, null, frame, false, true);
        index += 4;
      } else if (tag === 'BSONRegExp') {
        index = serializeBSONRegExp(buffer, key, value, index);
      } else if (tag === 'Int32') {
        index = serializeInt32(buffer, key, value, index);
      } else if (tag === 'MinKey' || tag === 'MaxKey') {
        index = serializeMinMax(buffer, key, value, index);
      } else if (typeof value._bsontype !== 'undefined') {
        throw new BSONError(`Unrecognized or invalid _bsontype: ${String(value._bsontype)}`);
      }
    } else if (type === 'function' && serializeFunctions) {
      index = serializeFunction(buffer, key, value, index);
    }
  }

  return index;
}
