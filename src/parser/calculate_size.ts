import { Binary } from '../binary';
import type { Document } from '../bson';
import { BSONError, BSONVersionError } from '../error';
import * as constants from '../constants';
import { ByteUtils } from '../utils/byte_utils';
import { isAnyArrayBuffer, isDate, isRegExp } from './utils';

export function internalCalculateObjectSize(
  object: Document,
  serializeFunctions?: boolean,
  ignoreUndefined?: boolean
): number {
  // Each stack entry carries its own ignoreUndefined so DBRef fields can force ignoreUndefined=true
  // regardless of the caller's setting, matching the behavior of serializeInto.
  const objectStack: Array<{ obj: Document; ignoreUndefined: boolean }> = [
    { obj: object, ignoreUndefined: ignoreUndefined ?? false }
  ];
  let total = 0;

  while (objectStack.length > 0) {
    const { obj, ignoreUndefined: frameIgnoreUndefined } = objectStack.pop()!;
    total += 5; // 4-byte size field + null terminator

    const isObjArray = Array.isArray(obj);
    let target = obj;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!isObjArray && typeof (obj as any)?.toBSON === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target = (obj as any).toBSON();
    }

    if (isObjArray) {
      const array = target as unknown[];
      for (let i = 0; i < array.length; i++) {
        total += calculateElementSize(
          i.toString(),
          array[i],
          serializeFunctions,
          true,
          frameIgnoreUndefined,
          objectStack
        );
      }
    } else {
      for (const key of Object.keys(target)) {
        total += calculateElementSize(
          key,
          target[key],
          serializeFunctions,
          false,
          frameIgnoreUndefined,
          objectStack
        );
      }
    }
  }

  return total;
}

/** @internal */
function calculateElementSize(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  serializeFunctions = false,
  isArray = false,
  ignoreUndefined = false,
  objectStack: Array<{ obj: Document; ignoreUndefined: boolean }>
): number {
  // If we have toBSON defined, override the current object
  if (typeof value?.toBSON === 'function') {
    value = value.toBSON();
  }

  switch (typeof value) {
    case 'string':
      return 1 + ByteUtils.utf8ByteLength(name) + 1 + 4 + ByteUtils.utf8ByteLength(value) + 1;
    case 'number':
      if (
        Math.floor(value) === value &&
        value >= constants.JS_INT_MIN &&
        value <= constants.JS_INT_MAX
      ) {
        if (value >= constants.BSON_INT32_MIN && value <= constants.BSON_INT32_MAX) {
          // 32 bit
          return ByteUtils.utf8ByteLength(name) + 1 + (4 + 1);
        } else {
          return ByteUtils.utf8ByteLength(name) + 1 + (8 + 1);
        }
      } else {
        // 64 bit
        return ByteUtils.utf8ByteLength(name) + 1 + (8 + 1);
      }
    case 'undefined':
      if (isArray || !ignoreUndefined) return ByteUtils.utf8ByteLength(name) + 1 + 1;
      return 0;
    case 'boolean':
      return ByteUtils.utf8ByteLength(name) + 1 + (1 + 1);
    case 'object':
      if (
        value != null &&
        typeof value._bsontype === 'string' &&
        value[constants.BSON_VERSION_SYMBOL] !== constants.BSON_MAJOR_VERSION
      ) {
        throw new BSONVersionError();
      } else if (value == null || value._bsontype === 'MinKey' || value._bsontype === 'MaxKey') {
        return ByteUtils.utf8ByteLength(name) + 1 + 1;
      } else if (value._bsontype === 'ObjectId') {
        return ByteUtils.utf8ByteLength(name) + 1 + (12 + 1);
      } else if (value instanceof Date || isDate(value)) {
        return ByteUtils.utf8ByteLength(name) + 1 + (8 + 1);
      } else if (
        ArrayBuffer.isView(value) ||
        value instanceof ArrayBuffer ||
        isAnyArrayBuffer(value)
      ) {
        return ByteUtils.utf8ByteLength(name) + 1 + (1 + 4 + 1) + value.byteLength;
      } else if (
        value._bsontype === 'Long' ||
        value._bsontype === 'Double' ||
        value._bsontype === 'Timestamp'
      ) {
        return ByteUtils.utf8ByteLength(name) + 1 + (8 + 1);
      } else if (value._bsontype === 'Decimal128') {
        return ByteUtils.utf8ByteLength(name) + 1 + (16 + 1);
      } else if (value._bsontype === 'Code') {
        // Calculate size depending on the availability of a scope
        if (value.scope != null && Object.keys(value.scope).length > 0) {
          objectStack.push({ obj: value.scope, ignoreUndefined });
          return (
            ByteUtils.utf8ByteLength(name) +
            1 +
            1 +
            4 +
            4 +
            ByteUtils.utf8ByteLength(value.code.toString()) +
            1
          );
        } else {
          return (
            ByteUtils.utf8ByteLength(name) +
            1 +
            1 +
            4 +
            ByteUtils.utf8ByteLength(value.code.toString()) +
            1
          );
        }
      } else if (value._bsontype === 'Binary') {
        const binary: Binary = value;
        // Check what kind of subtype we have
        if (binary.sub_type === Binary.SUBTYPE_BYTE_ARRAY) {
          return ByteUtils.utf8ByteLength(name) + 1 + (binary.position + 1 + 4 + 1 + 4);
        } else {
          return ByteUtils.utf8ByteLength(name) + 1 + (binary.position + 1 + 4 + 1);
        }
      } else if (value._bsontype === 'Symbol') {
        return (
          ByteUtils.utf8ByteLength(name) + 1 + ByteUtils.utf8ByteLength(value.value) + 4 + 1 + 1
        );
      } else if (value._bsontype === 'DBRef') {
        // Set up correct object for serialization
        const ordered_values = Object.assign(
          {
            $ref: value.collection,
            $id: value.oid
          },
          value.fields
        );

        // Add db reference if it exists
        if (value.db != null) {
          ordered_values['$db'] = value.db;
        }

        // DBRef fields always use ignoreUndefined=true to match serializeInto behavior.
        objectStack.push({ obj: ordered_values, ignoreUndefined: true });
        return ByteUtils.utf8ByteLength(name) + 1 + 1;
      } else if (value instanceof RegExp || isRegExp(value)) {
        return (
          ByteUtils.utf8ByteLength(name) +
          1 +
          1 +
          ByteUtils.utf8ByteLength(value.source) +
          1 +
          (value.global ? 1 : 0) +
          (value.ignoreCase ? 1 : 0) +
          (value.multiline ? 1 : 0) +
          1
        );
      } else if (value._bsontype === 'BSONRegExp') {
        return (
          ByteUtils.utf8ByteLength(name) +
          1 +
          1 +
          ByteUtils.utf8ByteLength(value.pattern) +
          1 +
          ByteUtils.utf8ByteLength(value.options) +
          1
        );
      } else {
        objectStack.push({ obj: value, ignoreUndefined });
        return ByteUtils.utf8ByteLength(name) + 1 + 1;
      }
    case 'function':
      if (serializeFunctions) {
        return (
          ByteUtils.utf8ByteLength(name) +
          1 +
          1 +
          4 +
          ByteUtils.utf8ByteLength(value.toString()) +
          1
        );
      }
      return 0;
    case 'bigint':
      return ByteUtils.utf8ByteLength(name) + 1 + (8 + 1);
    case 'symbol':
      return 0;
    default:
      throw new BSONError(`Unrecognized JS type: ${typeof value}`);
  }
}
