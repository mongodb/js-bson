import { Binary, UUID } from '../binary';
import type { Document } from '../bson';
import { Code } from '../code';
import * as constants from '../constants';
import { DBRef, isDBRefLike } from '../db_ref';
import { Decimal128 } from '../decimal128';
import { Double } from '../double';
import { BSONError } from '../error';
import { Int32 } from '../int_32';
import { Long } from '../long';
import { MaxKey } from '../max_key';
import { MinKey } from '../min_key';
import { ObjectId } from '../objectid';
import { BSONRegExp } from '../regexp';
import { BSONSymbol } from '../symbol';
import { Timestamp } from '../timestamp';
import { ByteUtils } from '../utils/byte_utils';
import { NumberUtils } from '../utils/number_utils';

/** @public */
export interface DeserializeOptions {
  /**
   * when deserializing a Long return as a BigInt.
   * @defaultValue `false`
   */
  useBigInt64?: boolean;
  /**
   * when deserializing a Long will fit it into a Number if it's smaller than 53 bits.
   * @defaultValue `true`
   */
  promoteLongs?: boolean;
  /**
   * when deserializing a Binary will return it as a node.js Buffer instance.
   * @defaultValue `false`
   */
  promoteBuffers?: boolean;
  /**
   * when deserializing will promote BSON values to their Node.js closest equivalent types.
   * @defaultValue `true`
   */
  promoteValues?: boolean;
  /**
   * allow to specify if there what fields we wish to return as unserialized raw buffer.
   * @defaultValue `null`
   */
  fieldsAsRaw?: Document;
  /**
   * return BSON regular expressions as BSONRegExp instances.
   * @defaultValue `false`
   */
  bsonRegExp?: boolean;
  /**
   * allows the buffer to be larger than the parsed BSON object.
   * @defaultValue `false`
   */
  allowObjectSmallerThanBufferSize?: boolean;
  /**
   * Offset into buffer to begin reading document from
   * @defaultValue `0`
   */
  index?: number;

  raw?: boolean;
  /** Allows for opt-out utf-8 validation for all keys or
   * specified keys. Must be all true or all false.
   *
   * @example
   * ```js
   * // disables validation on all keys
   *  validation: { utf8: false }
   *
   * // enables validation only on specified keys a, b, and c
   *  validation: { utf8: { a: true, b: true, c: true } }
   *
   *  // disables validation only on specified keys a, b
   *  validation: { utf8: { a: false, b: false } }
   * ```
   */
  validation?: { utf8: boolean | Record<string, true> | Record<string, false> };
}

// Internal long versions
const JS_INT_MAX_LONG = Long.fromNumber(constants.JS_INT_MAX);
const JS_INT_MIN_LONG = Long.fromNumber(constants.JS_INT_MIN);

export function internalDeserialize(
  buffer: Uint8Array,
  options: DeserializeOptions,
  isArray?: boolean
): Document {
  options = options == null ? {} : options;
  const index = options && options.index ? options.index : 0;
  // Read the document size
  const size = NumberUtils.getInt32LE(buffer, index);

  if (size < 5) {
    throw new BSONError(`bson size must be >= 5, is ${size}`);
  }

  if (options.allowObjectSmallerThanBufferSize && buffer.length < size) {
    throw new BSONError(`buffer length ${buffer.length} must be >= bson size ${size}`);
  }

  if (!options.allowObjectSmallerThanBufferSize && buffer.length !== size) {
    throw new BSONError(`buffer length ${buffer.length} must === bson size ${size}`);
  }

  if (size + index > buffer.byteLength) {
    throw new BSONError(
      `(bson size ${size} + options.index ${index} must be <= buffer length ${buffer.byteLength})`
    );
  }

  // Illegal end value
  if (buffer[index + size - 1] !== 0) {
    throw new BSONError(
      "One object, sized correctly, with a spot for an EOO, but the EOO isn't 0x00"
    );
  }

  // Start deserialization
  return deserializeObject(buffer, index, options, isArray);
}

interface NestedParsingFrame {
  // One of 3 supported types:
  // - constants.BSON_DATA_OBJECT
  // - constants.BSON_DATA_ARRAY
  // - constants.BSON_DATA_CODE_W_SCOPE
  elementType:
    | typeof constants.BSON_DATA_OBJECT
    | typeof constants.BSON_DATA_ARRAY
    | typeof constants.BSON_DATA_CODE_W_SCOPE;
  // Document that we will fill out as we parse the nested object
  holdingDocument: Document;
  // The name of the key we will set the parsed object on once we finish parsing the nested object, this is used in the onComplete callback to know where to set the parsed nested object in the parent document
  propertyName: string | number;
  // The index in the buffer where the current object ends, used to know when we are done parsing the current object and can pop the stack
  lastIndex: number;
  // Whether the current frame is parsing an array, used to know whether to interpret keys as strings or array indices
  isArray: boolean;
  // The next array index to use if this frame is parsing an array, used to assign numeric keys to array elements without having to utf-8 decode the key from the buffer
  arrayIndex: number;
  // When true, all objects in this frame will be returned as raw bson buffers without parsing.
  // This is used when the fieldsAsRaw option is used on a parent object, and is inherited by nested frames.
  // It can also be set to true if the global raw option is set, but it cannot be set to true for a frame if the global raw option is false.
  raw: boolean;
  // When true, this frame may be a DBRef. This is set to false if we encounter a key that is not valid for a DBRef, and is left as null for arrays since they cannot be DBRefs.
  isPossibleDBRef: boolean | null;
  // The utf-8 validation setting for this frame, used to determine whether to utf-8 validate keys in this frame. This is determined based on the global utf-8 validation setting and the specific keys specified in the validation option.
  validationSetting: boolean;
  functionString: string | null; // only used for Code with Scope
  // The enclosing frame, or null at the top level. The parsing stack is a linked list threaded
  // through this field rather than a separate array, which avoids array push/pop churn per frame.
  prev: NestedParsingFrame | null;
}

const allowedDBRefKeys = /^\$ref$|^\$id$|^\$db$/;

// Assigns a parsed value into the destination document, guarding the __proto__ key to avoid
// prototype pollution.
function assignValue(dest: Document, name: string | number, value: unknown): void {
  if (name === '__proto__') {
    Object.defineProperty(dest, name, {
      value,
      writable: true,
      enumerable: true,
      configurable: true
    });
  } else {
    dest[name] = value;
  }
}

// Promotes a plain document to a DBRef instance when it has the DBRef shape ($ref/$id[/$db]).
function toPotentialDbRef(doc: Document): DBRef | Document {
  if (isDBRefLike(doc)) {
    const { $ref, $id, $db, ...fields } = doc;
    return new DBRef($ref, $id, $db, fields);
  }
  return doc;
}

function deserializeObject(
  buffer: Uint8Array,
  index: number,
  options: DeserializeOptions,
  isArray = false
) {
  // Settings configured from options parameter

  // Strips prototype chain so inherited properties don't affect option reads.
  options = { ...options };

  // Used to track fields that should be returned as raw bson buffers without parsing, this is set based on the fieldsAsRaw option and is inherited by nested frames when parsing nested objects
  const fieldsAsRaw = options['fieldsAsRaw'] == null ? null : options['fieldsAsRaw'];

  // Return raw bson buffer instead of parsing it
  const raw = options['raw'] == null ? false : options['raw'];

  // Return BSONRegExp objects instead of native regular expressions
  const bsonRegExp = typeof options['bsonRegExp'] === 'boolean' ? options['bsonRegExp'] : false;

  // Controls the promotion of values vs wrapper classes
  const promoteBuffers = options.promoteBuffers ?? false;
  const promoteLongs = options.promoteLongs ?? true;
  const promoteValues = options.promoteValues ?? true;
  const useBigInt64 = options.useBigInt64 ?? false;

  // Validate bigint and long promotion settings
  if (useBigInt64 && !promoteValues) {
    throw new BSONError('Must either request bigint or Long for int64 deserialization');
  }
  if (useBigInt64 && !promoteLongs) {
    throw new BSONError('Must either request bigint or Long for int64 deserialization');
  }

  // Ensures default validation option if none given
  const validation = options.validation == null ? { utf8: true } : options.validation;

  // Shows if global utf-8 validation is enabled or disabled
  let globalUTFValidation = true;
  // Reflects utf-8 validation setting regardless of global or specific key validation
  let validationSetting: boolean;
  // Set of keys either to enable or disable validation on
  let utf8KeysSet;

  // Check for boolean uniformity and empty validation option
  const utf8ValidatedKeys = validation.utf8;
  if (typeof utf8ValidatedKeys === 'boolean') {
    validationSetting = utf8ValidatedKeys;
  } else {
    globalUTFValidation = false;
    const utf8ValidationValues = Object.keys(utf8ValidatedKeys).map(function (key) {
      return utf8ValidatedKeys[key];
    });
    if (utf8ValidationValues.length === 0) {
      throw new BSONError('UTF-8 validation setting cannot be empty');
    }
    if (typeof utf8ValidationValues[0] !== 'boolean') {
      throw new BSONError('Invalid UTF-8 validation option, must specify boolean values');
    }
    validationSetting = utf8ValidationValues[0];
    // Ensures boolean uniformity in utf-8 validation (all true or all false)
    if (!utf8ValidationValues.every(item => item === validationSetting)) {
      throw new BSONError('Invalid UTF-8 validation option - keys must be all true or all false');
    }
  }

  // Add keys to set that will either be validated or not based on validationSetting
  if (!globalUTFValidation) {
    utf8KeysSet = new Set();

    for (const key of Object.keys(utf8ValidatedKeys)) {
      utf8KeysSet.add(key);
    }
  }

  // Begin parsing the document

  // Set the start index
  const startIndex = index;

  // Validate that we have at least 4 bytes of buffer
  if (buffer.length < 5) throw new BSONError('corrupt bson message < 5 bytes long');

  // Read the document size
  const size = NumberUtils.getInt32LE(buffer, index);
  // Skip past the size field
  index += 4;

  // Ensure buffer is valid size
  if (size < 5 || size > buffer.length) throw new BSONError('corrupt bson message');

  // Create holding object
  const rootObject: Document = isArray ? [] : {};
  // Used for arrays to skip having to perform utf8 decoding
  let arrayIndex = 0;

  let isPossibleDBRef = isArray ? false : null;

  // Top of the parsing stack (a linked list via each frame's `prev`), or null at the top level.
  let currentFrame: NestedParsingFrame | null = null;
  // Destination object for the current frame (the parent's holdingDocument, or rootObject at the
  // top level). Maintained alongside currentFrame so per-field assignment never recomputes it.
  let currentDest: Document = rootObject;
  // Whether the current frame is an array. Maintained alongside currentFrame so the per-field key
  // logic does not branch on currentFrame every iteration.
  let currentIsArray = isArray;

  // While we have more left data left keep parsing
  while (true) {
    // Read the type
    const elementType = buffer[index++];

    // If we get a zero it's the last byte, exit
    if (elementType === 0) {
      // 0 byte marks end of document.
      if (currentFrame) {
        // If we're in a frame, that means the end of the current nested document
        if (index === currentFrame.lastIndex) {
          // Snapshot the completed frame before updating currentFrame to the parent.
          const completedFrame: NestedParsingFrame = currentFrame;
          currentFrame = completedFrame.prev;
          if (currentFrame === null) {
            currentDest = rootObject;
            currentIsArray = isArray;
          } else {
            currentDest = currentFrame.holdingDocument;
            currentIsArray = currentFrame.isArray;
          }
          // finish the frame
          let result: Document = completedFrame.holdingDocument;
          switch (completedFrame.elementType) {
            case constants.BSON_DATA_OBJECT:
              // if this is a DBRef, we need to construct a DBRef object instead of a plain object
              if (completedFrame.isPossibleDBRef) {
                result = toPotentialDbRef(result);
              }
              break;
            case constants.BSON_DATA_ARRAY:
              // nothing to do, the holding document is already an array and the keys were set as numeric indices
              break;
            case constants.BSON_DATA_CODE_W_SCOPE:
              // the holding document is the scope, we need to construct a Code object with the function string and scope
              result = new Code(completedFrame.functionString!, completedFrame.holdingDocument);
              break;
            default:
              throw new BSONError('Unexpected element type in frame stack');
          }
          // set the value in the parent document (currentDest now points to the parent's document)
          assignValue(currentDest, completedFrame.propertyName, result);
          continue;
        } else {
          // Current index does not match the last index of the frame, the document is malformed
          if (currentFrame.elementType === constants.BSON_DATA_ARRAY) {
            throw new BSONError('corrupted array bson');
          }
          throw new BSONError('Bad BSON Document: object not properly terminated');
        }
      } else {
        // If we're not in a frame, that means the end of the root document, so we break out of the loop and return the object
        break;
      }
    }

    // Get the start search index
    let i = index;
    // Locate the end of the c string
    while (buffer[i] !== 0x00 && i < buffer.length) {
      i++;
    }

    // If are at the end of the buffer there is a problem with the document
    if (i >= buffer.byteLength) throw new BSONError('Bad BSON Document: illegal CString');

    // Represents the key
    const name = currentIsArray
      ? currentFrame !== null
        ? currentFrame.arrayIndex++
        : arrayIndex++
      : ByteUtils.toUTF8(buffer, index, i, false);

    // shouldValidateKey is true if the key should be validated, false otherwise.
    // Within a nested frame the original code passed a collapsed boolean validation option,
    // so all keys in the frame are validated uniformly using the frame's setting.
    let shouldValidateKey: boolean;
    if (currentFrame !== null) {
      shouldValidateKey = currentFrame.validationSetting;
    } else if (globalUTFValidation || utf8KeysSet?.has(name)) {
      shouldValidateKey = validationSetting;
    } else {
      shouldValidateKey = !validationSetting;
    }

    // Route DBRef key tracking to the current frame; the root variable handles the root doc.
    if (currentFrame !== null) {
      if (currentFrame.isPossibleDBRef !== false && typeof name === 'string' && name[0] === '$') {
        currentFrame.isPossibleDBRef = allowedDBRefKeys.test(name);
      }
    } else if (isPossibleDBRef !== false && (name as string)[0] === '$') {
      isPossibleDBRef = allowedDBRefKeys.test(name as string);
    }
    let value;
    let isDeferredValue = false;

    index = i + 1;

    if (elementType === constants.BSON_DATA_STRING) {
      const stringSize = NumberUtils.getInt32LE(buffer, index);
      index += 4;
      if (
        stringSize <= 0 ||
        stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      ) {
        throw new BSONError('bad string length in bson');
      }
      value = ByteUtils.toUTF8(buffer, index, index + stringSize - 1, shouldValidateKey);
      index = index + stringSize;
    } else if (elementType === constants.BSON_DATA_OID) {
      const oid = ByteUtils.allocateUnsafe(12);
      for (let i = 0; i < 12; i++) oid[i] = buffer[index + i];
      value = new ObjectId(oid);
      index = index + 12;
    } else if (elementType === constants.BSON_DATA_INT && promoteValues === false) {
      value = new Int32(NumberUtils.getInt32LE(buffer, index));
      index += 4;
    } else if (elementType === constants.BSON_DATA_INT) {
      value = NumberUtils.getInt32LE(buffer, index);
      index += 4;
    } else if (elementType === constants.BSON_DATA_NUMBER) {
      value = NumberUtils.getFloat64LE(buffer, index);
      index += 8;
      if (promoteValues === false) value = new Double(value);
    } else if (elementType === constants.BSON_DATA_DATE) {
      const lowBits = NumberUtils.getInt32LE(buffer, index);
      const highBits = NumberUtils.getInt32LE(buffer, index + 4);
      index += 8;

      value = new Date(new Long(lowBits, highBits).toNumber());
    } else if (elementType === constants.BSON_DATA_BOOLEAN) {
      if (buffer[index] !== 0 && buffer[index] !== 1)
        throw new BSONError('illegal boolean type value');
      value = buffer[index++] === 1;
    } else if (elementType === constants.BSON_DATA_OBJECT) {
      const objectSize = NumberUtils.getInt32LE(buffer, index);

      if (objectSize < 5 || objectSize > buffer.length - index)
        throw new BSONError('bad embedded document length in bson');

      // We have a raw value: either the global raw option, or the parent frame requested raw elements.
      if (raw || (currentFrame?.raw ?? false)) {
        value = buffer.subarray(index, index + objectSize);
        index = index + objectSize;
      } else {
        isDeferredValue = true;
        const objectFrame: NestedParsingFrame = {
          holdingDocument: {},
          elementType: constants.BSON_DATA_OBJECT,
          propertyName: name,
          functionString: null,
          lastIndex: index + objectSize,
          isArray: false,
          arrayIndex: 0,
          raw: false,
          isPossibleDBRef: null, // we don't know if this is a DBRef until we parse the keys, so we start with null and set to false if we encounter a key that is not valid for a DBRef
          validationSetting: shouldValidateKey,
          prev: currentFrame
        };
        currentFrame = objectFrame;
        currentDest = objectFrame.holdingDocument;
        currentIsArray = false;
        index = index + 4;
      }
    } else if (elementType === constants.BSON_DATA_ARRAY) {
      const objectSize = NumberUtils.getInt32LE(buffer, index);

      if (objectSize < 5 || objectSize > buffer.length - index)
        throw new BSONError('bad embedded array length in bson');

      // Stop index
      const stopIndex = index + objectSize;

      // fieldsAsRaw match: push with raw=true so embedded objects inside come back as raw bytes.
      // Also propagate raw from the parent frame (nested arrays inside a raw array stay raw).
      const arrayRaw = !!(fieldsAsRaw && fieldsAsRaw[name]) || (currentFrame?.raw ?? false);
      isDeferredValue = true;
      const arrayFrame: NestedParsingFrame = {
        holdingDocument: [],
        elementType: constants.BSON_DATA_ARRAY,
        propertyName: name,
        functionString: null,
        lastIndex: stopIndex,
        isArray: true,
        arrayIndex: 0,
        raw: arrayRaw,
        isPossibleDBRef: false,
        validationSetting: shouldValidateKey,
        prev: currentFrame
      };
      currentFrame = arrayFrame;
      currentDest = arrayFrame.holdingDocument;
      currentIsArray = true;
      index = index + 4;
    } else if (elementType === constants.BSON_DATA_UNDEFINED) {
      value = undefined;
    } else if (elementType === constants.BSON_DATA_NULL) {
      value = null;
    } else if (elementType === constants.BSON_DATA_LONG) {
      if (useBigInt64) {
        value = NumberUtils.getBigInt64LE(buffer, index);
        index += 8;
      } else {
        // Unpack the low and high bits
        const lowBits = NumberUtils.getInt32LE(buffer, index);
        const highBits = NumberUtils.getInt32LE(buffer, index + 4);
        index += 8;

        const long = new Long(lowBits, highBits);
        // Promote the long if possible
        if (promoteLongs && promoteValues === true) {
          value =
            long.lessThanOrEqual(JS_INT_MAX_LONG) && long.greaterThanOrEqual(JS_INT_MIN_LONG)
              ? long.toNumber()
              : long;
        } else {
          value = long;
        }
      }
    } else if (elementType === constants.BSON_DATA_DECIMAL128) {
      // Buffer to contain the decimal bytes
      const bytes = ByteUtils.allocateUnsafe(16);
      // Copy the next 16 bytes into the bytes buffer
      for (let i = 0; i < 16; i++) bytes[i] = buffer[index + i];
      // Update index
      index = index + 16;
      // Assign the new Decimal128 value
      value = new Decimal128(bytes);
    } else if (elementType === constants.BSON_DATA_BINARY) {
      let binarySize = NumberUtils.getInt32LE(buffer, index);
      index += 4;
      const totalBinarySize = binarySize;
      const subType = buffer[index++];

      // Did we have a negative binary size, throw
      if (binarySize < 0) throw new BSONError('Negative binary type element size found');

      // Is the length longer than the document
      if (binarySize > buffer.byteLength)
        throw new BSONError('Binary type size larger than document size');

      // If we have subtype 2 skip the 4 bytes for the size
      if (subType === Binary.SUBTYPE_BYTE_ARRAY) {
        binarySize = NumberUtils.getInt32LE(buffer, index);
        index += 4;
        if (binarySize < 0)
          throw new BSONError('Negative binary type element size found for subtype 0x02');
        if (binarySize > totalBinarySize - 4)
          throw new BSONError('Binary type with subtype 0x02 contains too long binary size');
        if (binarySize < totalBinarySize - 4)
          throw new BSONError('Binary type with subtype 0x02 contains too short binary size');
      }

      if (promoteBuffers && promoteValues) {
        value = ByteUtils.toLocalBufferType(buffer.subarray(index, index + binarySize));
      } else {
        value = new Binary(buffer.subarray(index, index + binarySize), subType);
        if (subType === constants.BSON_BINARY_SUBTYPE_UUID_NEW && UUID.isValid(value)) {
          value = value.toUUID();
        }
      }

      // Update the index
      index = index + binarySize;
    } else if (elementType === constants.BSON_DATA_REGEXP && bsonRegExp === false) {
      // Get the start search index
      i = index;
      // Locate the end of the c string
      while (buffer[i] !== 0x00 && i < buffer.length) {
        i++;
      }
      // If are at the end of the buffer there is a problem with the document
      if (i >= buffer.length) throw new BSONError('Bad BSON Document: illegal CString');
      // Return the C string
      const source = ByteUtils.toUTF8(buffer, index, i, false);
      // Create the regexp
      index = i + 1;

      // Get the start search index
      i = index;
      // Locate the end of the c string
      while (buffer[i] !== 0x00 && i < buffer.length) {
        i++;
      }
      // If are at the end of the buffer there is a problem with the document
      if (i >= buffer.length) throw new BSONError('Bad BSON Document: illegal CString');
      // Return the C string
      const regExpOptions = ByteUtils.toUTF8(buffer, index, i, false);
      index = i + 1;

      // For each option add the corresponding one for javascript
      const optionsArray = new Array(regExpOptions.length);

      // Parse options
      for (i = 0; i < regExpOptions.length; i++) {
        switch (regExpOptions[i]) {
          case 'm':
            optionsArray[i] = 'm';
            break;
          case 's':
            optionsArray[i] = 'g';
            break;
          case 'i':
            optionsArray[i] = 'i';
            break;
        }
      }

      value = new RegExp(source, optionsArray.join(''));
    } else if (elementType === constants.BSON_DATA_REGEXP && bsonRegExp === true) {
      // Get the start search index
      i = index;
      // Locate the end of the c string
      while (buffer[i] !== 0x00 && i < buffer.length) {
        i++;
      }
      // If are at the end of the buffer there is a problem with the document
      if (i >= buffer.length) throw new BSONError('Bad BSON Document: illegal CString');
      // Return the C string
      const source = ByteUtils.toUTF8(buffer, index, i, false);
      index = i + 1;

      // Get the start search index
      i = index;
      // Locate the end of the c string
      while (buffer[i] !== 0x00 && i < buffer.length) {
        i++;
      }
      // If are at the end of the buffer there is a problem with the document
      if (i >= buffer.length) throw new BSONError('Bad BSON Document: illegal CString');
      // Return the C string
      const regExpOptions = ByteUtils.toUTF8(buffer, index, i, false);
      index = i + 1;

      // Set the object
      value = new BSONRegExp(source, regExpOptions);
    } else if (elementType === constants.BSON_DATA_SYMBOL) {
      const stringSize = NumberUtils.getInt32LE(buffer, index);
      index += 4;
      if (
        stringSize <= 0 ||
        stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      ) {
        throw new BSONError('bad string length in bson');
      }
      const symbol = ByteUtils.toUTF8(buffer, index, index + stringSize - 1, shouldValidateKey);
      value = promoteValues ? symbol : new BSONSymbol(symbol);
      index = index + stringSize;
    } else if (elementType === constants.BSON_DATA_TIMESTAMP) {
      value = new Timestamp({
        i: NumberUtils.getUint32LE(buffer, index),
        t: NumberUtils.getUint32LE(buffer, index + 4)
      });
      index += 8;
    } else if (elementType === constants.BSON_DATA_MIN_KEY) {
      value = new MinKey();
    } else if (elementType === constants.BSON_DATA_MAX_KEY) {
      value = new MaxKey();
    } else if (elementType === constants.BSON_DATA_CODE) {
      const stringSize = NumberUtils.getInt32LE(buffer, index);
      index += 4;
      if (
        stringSize <= 0 ||
        stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      ) {
        throw new BSONError('bad string length in bson');
      }
      const functionString = ByteUtils.toUTF8(
        buffer,
        index,
        index + stringSize - 1,
        shouldValidateKey
      );

      value = new Code(functionString);

      // Update parse index position
      index = index + stringSize;
    } else if (elementType === constants.BSON_DATA_CODE_W_SCOPE) {
      const totalSize = NumberUtils.getInt32LE(buffer, index);
      index += 4;

      // Element cannot be shorter than totalSize + stringSize + documentSize + terminator
      if (totalSize < 4 + 4 + 4 + 1) {
        throw new BSONError('code_w_scope total size shorter minimum expected length');
      }

      // Get the code string size
      const stringSize = NumberUtils.getInt32LE(buffer, index);
      index += 4;
      // Check if we have a valid string
      if (
        stringSize <= 0 ||
        stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      ) {
        throw new BSONError('bad string length in bson');
      }

      // Javascript function
      const functionString = ByteUtils.toUTF8(
        buffer,
        index,
        index + stringSize - 1,
        shouldValidateKey
      );
      // Update parse index position
      index = index + stringSize;
      // Parse the element
      const _index = index;
      // Decode the size of the object document
      const objectSize = NumberUtils.getInt32LE(buffer, index);

      if (objectSize < 5 || objectSize > buffer.length - index)
        throw new BSONError('bad scope document size in code_w_scope');

      // Check if field length is too short
      if (totalSize < 4 + 4 + objectSize + stringSize) {
        throw new BSONError('code_w_scope total size is too short, truncating scope');
      }

      // Check if totalSize field is too long
      if (totalSize > 4 + 4 + objectSize + stringSize) {
        throw new BSONError('code_w_scope total size is too long, clips outer document');
      }

      isDeferredValue = true;
      const scopeFrame: NestedParsingFrame = {
        holdingDocument: {},
        elementType: constants.BSON_DATA_CODE_W_SCOPE,
        propertyName: name,
        functionString: functionString,
        lastIndex: _index + objectSize,
        isArray: false,
        arrayIndex: 0,
        raw: false,
        isPossibleDBRef: null,
        validationSetting: shouldValidateKey,
        prev: currentFrame
      };
      currentFrame = scopeFrame;
      currentDest = scopeFrame.holdingDocument;
      currentIsArray = false;
      index = index + 4; // move index past the size of the object, the rest of the object will be parsed in subsequent iterations of this loop
    } else if (elementType === constants.BSON_DATA_DBPOINTER) {
      // Get the code string size
      const stringSize = NumberUtils.getInt32LE(buffer, index);
      index += 4;
      // Check if we have a valid string
      if (
        stringSize <= 0 ||
        stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      )
        throw new BSONError('bad string length in bson');
      // Namespace
      const namespace = ByteUtils.toUTF8(buffer, index, index + stringSize - 1, shouldValidateKey);
      // Update parse index position
      index = index + stringSize;

      // Read the oid
      const oidBuffer = ByteUtils.allocateUnsafe(12);
      for (let i = 0; i < 12; i++) oidBuffer[i] = buffer[index + i];
      const oid = new ObjectId(oidBuffer);

      // Update the index
      index = index + 12;

      // Upgrade to DBRef type
      value = new DBRef(namespace, oid);
    } else {
      throw new BSONError(
        `Detected unknown BSON type ${elementType.toString(16)} for fieldname "${name}"`
      );
    }

    // If we have the value, set it on the target object
    if (!isDeferredValue) {
      assignValue(currentDest, name, value);
    }
  }

  // Check if we have any frames left on the stack, if we do then we had a malformed document
  if (currentFrame !== null) {
    throw new BSONError('corrupted bson, more objects expected based on the current document size');
  }
  const object = rootObject;

  // Check if the deserialization was against a valid array/object
  if (size !== index - startIndex) {
    if (isArray) throw new BSONError('corrupt array bson');
    throw new BSONError('corrupt object bson');
  }

  // if we did not find "$ref", "$id", "$db", or found an extraneous $key, don't make a DBRef
  if (!isPossibleDBRef) return object;

  // If the object is DBRef-like, create a new DBRef instance
  return toPotentialDbRef(object);
}
