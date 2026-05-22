import { Binary, validateBinaryVector } from '../binary';
import type { BSONSymbol, DBRef, Document, MaxKey } from '../bson';
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

/*
 * isArray indicates if we are writing to a BSON array (type 0x04)
 * which forces the "key" which really an array index as a string to be written as ascii
 * This will catch any errors in index as a string generation
 */

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
  } else if (value._bsontype === 'MinKey') {
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
    value._bsontype === 'Long' ? constants.BSON_DATA_LONG : constants.BSON_DATA_TIMESTAMP;
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
  // The object being serialized at this frame.
  // Held so it can be removed from the cycle-detection path when this frame completes.
  sourceObject: Document;
  // Whether the object we are serializing is an array.
  // This forces the keys to be serialized as ASCII strings of their index in the array.
  isArray: boolean;
  // The key-value pairs of the object we are serializing, snapshotted at frame creation.
  kvPairs: [string, unknown][];
  // The number of serialized kvPairs.
  // Used to keep track of where we are in the serialization process
  serializedPairCount: number;
  // The index in the buffer where the size of the current serialized object is stored.
  // We will only know the size of the object once we have finished serializing it, so we keep track of where to write the size once we know it.
  objectSizeIndex: number;
  // The index in the buffer where the size of the code with scope object is stored.
  // Used for Code with Scope serialization.
  // We will only know the size of the code with scope object once we have finished serializing it, so we keep track of where to write the size once we know it.
  codeSizeIndex: number | null;
}

function toKvPairs(object: Document): [string, unknown][] {
  if (Array.isArray(object)) {
    const kvPairs = new Array<[string, unknown]>(object.length);
    for (let i = 0; i < object.length; i++) {
      kvPairs[i] = [`${i}`, object[i]];
    }
    return kvPairs;
  } else if (object instanceof Map || isMap(object)) {
    return Array.from((object as Map<unknown, unknown>).entries()) as [string, unknown][];
  } else {
    let target: Document = object;
    if (typeof (target as any)?.toBSON === 'function') {
      target = (target as any).toBSON() as Document;
      if (target != null && typeof target !== 'object') {
        throw new BSONError('toBSON function did not return an object');
      }
    }
    const keys = Object.keys(target);
    const kvPairs = new Array<[string, unknown]>(keys.length);
    for (let i = 0; i < keys.length; i++) {
      kvPairs[i] = [keys[i], target[keys[i]]];
    }
    return kvPairs;
  }
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

  const stack: SerializationFrame[] = [
    {
      kvPairs: toKvPairs(object),
      serializedPairCount: 0,
      objectSizeIndex: startingIndex,
      codeSizeIndex: null,
      sourceObject: object,
      isArray: Array.isArray(object)
    }
  ];
  let index = startingIndex + 4;

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];

    if (frame.serializedPairCount >= frame.kvPairs.length) {
      buffer[index++] = 0x00;
      NumberUtils.setInt32LE(buffer, frame.objectSizeIndex, index - frame.objectSizeIndex);
      if (frame.codeSizeIndex !== null) {
        NumberUtils.setInt32LE(buffer, frame.codeSizeIndex, index - frame.codeSizeIndex);
      }
      path.delete(frame.sourceObject);
      stack.pop();
      continue;
    }

    const pair = frame.kvPairs[frame.serializedPairCount++];
    const key = pair[0];
    let value: any = pair[1];

    if (typeof value?.toBSON === 'function') {
      value = value.toBSON();
    }

    if (!frame.isArray && typeof key === 'string' && !ignoreKeys.has(key)) {
      if (key.match(regexp) != null) {
        throw new BSONError('key ' + key + ' must not contain null bytes');
      }
      if (checkKeys) {
        if ('$' === key[0]) {
          throw new BSONError('key ' + key + " must not start with '$'");
        } else if (key.includes('.')) {
          throw new BSONError('key ' + key + " must not contain '.'");
        }
      }
    }

    const type = typeof value;

    if (value === undefined) {
      if (frame.isArray || ignoreUndefined === false) {
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
        stack.push({
          kvPairs: toKvPairs(value),
          serializedPairCount: 0,
          objectSizeIndex: nestedStartIndex,
          codeSizeIndex: null,
          sourceObject: value,
          isArray: nestedIsArray
        });
        index += 4;
      }
    } else if (type === 'object') {
      if (value[constants.BSON_VERSION_SYMBOL] !== constants.BSON_MAJOR_VERSION) {
        throw new BSONVersionError();
      } else if (value._bsontype === 'ObjectId') {
        index = serializeObjectId(buffer, key, value, index);
      } else if (value._bsontype === 'Decimal128') {
        index = serializeDecimal128(buffer, key, value, index);
      } else if (value._bsontype === 'Long' || value._bsontype === 'Timestamp') {
        index = serializeLong(buffer, key, value, index);
      } else if (value._bsontype === 'Double') {
        index = serializeDouble(buffer, key, value, index);
      } else if (value._bsontype === 'Code') {
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
          stack.push({
            kvPairs: toKvPairs(scope),
            serializedPairCount: 0,
            objectSizeIndex: index,
            codeSizeIndex: codeTotalSizeIndex,
            sourceObject: scope,
            isArray: false
          });
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
      } else if (value._bsontype === 'Binary') {
        index = serializeBinary(buffer, key, value, index);
      } else if (value._bsontype === 'BSONSymbol') {
        index = serializeSymbol(buffer, key, value, index);
      } else if (value._bsontype === 'DBRef') {
        const dbref = value as DBRef;
        const orderedValues: Document = Object.assign(
          { $ref: dbref.collection },
          dbref.oid ? { $id: dbref.oid } : null,
          dbref.db ? { $db: dbref.db } : null,
          dbref.fields
        );
        buffer[index++] = constants.BSON_DATA_OBJECT;
        index += ByteUtils.encodeUTF8Into(buffer, key, index);
        buffer[index++] = 0x00;
        path.add(orderedValues);
        stack.push({
          kvPairs: toKvPairs(orderedValues),
          serializedPairCount: 0,
          objectSizeIndex: index,
          codeSizeIndex: null,
          sourceObject: orderedValues,
          isArray: false
        });
        index += 4;
      } else if (value._bsontype === 'BSONRegExp') {
        index = serializeBSONRegExp(buffer, key, value, index);
      } else if (value._bsontype === 'Int32') {
        index = serializeInt32(buffer, key, value, index);
      } else if (value._bsontype === 'MinKey' || value._bsontype === 'MaxKey') {
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
