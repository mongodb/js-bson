import { Buffer } from 'buffer';
import { Binary } from '../binary';
import type { Document } from '../bson';
import { Code } from '../code';
import * as constants from '../constants';
import { DBRef, DBRefLike, isDBRefLike } from '../db_ref';
import { Decimal128 } from '../decimal128';
import { Double } from '../double';
import { Int32 } from '../int_32';
import { Long } from '../long';
import { MaxKey } from '../max_key';
import { MinKey } from '../min_key';
import { ObjectId } from '../objectid';
import { BSONRegExp } from '../regexp';
import { BSONSymbol } from '../symbol';
import { Timestamp } from '../timestamp';
import { validateUtf8 } from '../validate_utf8';

/** @public */
export interface DeserializeOptions {
  /** evaluate functions in the BSON document scoped to the object deserialized. */
  evalFunctions?: boolean;
  /** cache evaluated functions for reuse. */
  cacheFunctions?: boolean;
  /**
   * use a crc32 code for caching, otherwise use the string of the function.
   * @deprecated this option to use the crc32 function never worked as intended
   * due to the fact that the crc32 function itself was never implemented.
   * */
  cacheFunctionsCrc32?: boolean;
  /** when deserializing a Long will fit it into a Number if it's smaller than 53 bits */
  promoteLongs?: boolean;
  /** when deserializing a Binary will return it as a node.js Buffer instance. */
  promoteBuffers?: boolean;
  /** when deserializing will promote BSON values to their Node.js closest equivalent types. */
  promoteValues?: boolean;
  /** allow to specify if there what fields we wish to return as unserialized raw buffer. */
  fieldsAsRaw?: Document;
  /** return BSON regular expressions as BSONRegExp instances. */
  bsonRegExp?: boolean;
  /** allows the buffer to be larger than the parsed BSON object */
  allowObjectSmallerThanBufferSize?: boolean;
  /** Offset into buffer to begin reading document from */
  index?: number;

  raw?: boolean;
}

// Internal long versions
const JS_INT_MAX_LONG = Long.fromNumber(constants.JS_INT_MAX);
const JS_INT_MIN_LONG = Long.fromNumber(constants.JS_INT_MIN);

const functionCache: { [hash: string]: Function } = {};

export function deserialize(
  buffer: Buffer,
  options: DeserializeOptions,
  isArray?: boolean
): Document {
  options = options == null ? {} : options;
  const index = options && options.index ? options.index : 0;
  // Read the document size
  const size =
    buffer[index] |
    (buffer[index + 1] << 8) |
    (buffer[index + 2] << 16) |
    (buffer[index + 3] << 24);

  if (size < 5) {
    throw new Error(`bson size must be >= 5, is ${size}`);
  }

  if (options.allowObjectSmallerThanBufferSize && buffer.length < size) {
    throw new Error(`buffer length ${buffer.length} must be >= bson size ${size}`);
  }

  if (!options.allowObjectSmallerThanBufferSize && buffer.length !== size) {
    throw new Error(`buffer length ${buffer.length} must === bson size ${size}`);
  }

  if (size + index > buffer.byteLength) {
    throw new Error(
      `(bson size ${size} + options.index ${index} must be <= buffer length ${buffer.byteLength})`
    );
  }

  // Illegal end value
  if (buffer[index + size - 1] !== 0) {
    throw new Error("One object, sized correctly, with a spot for an EOO, but the EOO isn't 0x00");
  }

  // Start deserializtion
  return deserializeObject(buffer, index, options, isArray);
}

function deserializeObject(
  buffer: Buffer,
  index: number,
  options: DeserializeOptions,
  isArray = false
) {
  const evalFunctions = options['evalFunctions'] == null ? false : options['evalFunctions'];
  const cacheFunctions = options['cacheFunctions'] == null ? false : options['cacheFunctions'];

  const fieldsAsRaw = options['fieldsAsRaw'] == null ? null : options['fieldsAsRaw'];

  // Return raw bson buffer instead of parsing it
  const raw = options['raw'] == null ? false : options['raw'];

  // Return BSONRegExp objects instead of native regular expressions
  const bsonRegExp = typeof options['bsonRegExp'] === 'boolean' ? options['bsonRegExp'] : false;

  // Controls the promotion of values vs wrapper classes
  const promoteBuffers = options['promoteBuffers'] == null ? false : options['promoteBuffers'];
  const promoteLongs = options['promoteLongs'] == null ? true : options['promoteLongs'];
  const promoteValues = options['promoteValues'] == null ? true : options['promoteValues'];

  // Set the start index
  const startIndex = index;

  // Validate that we have at least 4 bytes of buffer
  if (buffer.length < 5) throw new Error('corrupt bson message < 5 bytes long');

  // Read the document size
  const size =
    buffer[index++] | (buffer[index++] << 8) | (buffer[index++] << 16) | (buffer[index++] << 24);

  // Ensure buffer is valid size
  if (size < 5 || size > buffer.length) throw new Error('corrupt bson message');

  // Create holding object
  const object: Document = isArray ? [] : {};
  // Used for arrays to skip having to perform utf8 decoding
  let arrayIndex = 0;
  const done = false;

  // While we have more left data left keep parsing
  while (!done) {
    // Read the type
    const elementType = buffer[index++];

    // If we get a zero it's the last byte, exit
    if (elementType === 0) break;

    // Get the start search index
    let i = index;
    // Locate the end of the c string
    while (buffer[i] !== 0x00 && i < buffer.length) {
      i++;
    }

    // If are at the end of the buffer there is a problem with the document
    if (i >= buffer.byteLength) throw new Error('Bad BSON Document: illegal CString');
    const name = isArray ? arrayIndex++ : buffer.toString('utf8', index, i);
    let value;

    index = i + 1;

    if (elementType === constants.BSON_DATA_STRING) {
      const stringSize =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);
      if (
        stringSize <= 0 ||
        stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      )
        throw new Error('bad string length in bson');

      if (!validateUtf8(buffer, index, index + stringSize - 1)) {
        throw new Error('Invalid UTF-8 string in BSON document');
      }

      value = buffer.toString('utf8', index, index + stringSize - 1);

      index = index + stringSize;
    } else if (elementType === constants.BSON_DATA_OID) {
      const oid = Buffer.alloc(12);
      buffer.copy(oid, 0, index, index + 12);
      value = new ObjectId(oid);
      index = index + 12;
    } else if (elementType === constants.BSON_DATA_INT && promoteValues === false) {
      value = new Int32(
        buffer[index++] | (buffer[index++] << 8) | (buffer[index++] << 16) | (buffer[index++] << 24)
      );
    } else if (elementType === constants.BSON_DATA_INT) {
      value =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);
    } else if (elementType === constants.BSON_DATA_NUMBER && promoteValues === false) {
      value = new Double(buffer.readDoubleLE(index));
      index = index + 8;
    } else if (elementType === constants.BSON_DATA_NUMBER) {
      value = buffer.readDoubleLE(index);
      index = index + 8;
    } else if (elementType === constants.BSON_DATA_DATE) {
      const lowBits =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);
      const highBits =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);
      value = new Date(new Long(lowBits, highBits).toNumber());
    } else if (elementType === constants.BSON_DATA_BOOLEAN) {
      if (buffer[index] !== 0 && buffer[index] !== 1) throw new Error('illegal boolean type value');
      value = buffer[index++] === 1;
    } else if (elementType === constants.BSON_DATA_OBJECT) {
      const _index = index;
      const objectSize =
        buffer[index] |
        (buffer[index + 1] << 8) |
        (buffer[index + 2] << 16) |
        (buffer[index + 3] << 24);
      if (objectSize <= 0 || objectSize > buffer.length - index)
        throw new Error('bad embedded document length in bson');

      // We have a raw value
      if (raw) {
        value = buffer.slice(index, index + objectSize);
      } else {
        value = deserializeObject(buffer, _index, options, false);
      }

      index = index + objectSize;
    } else if (elementType === constants.BSON_DATA_ARRAY) {
      const _index = index;
      const objectSize =
        buffer[index] |
        (buffer[index + 1] << 8) |
        (buffer[index + 2] << 16) |
        (buffer[index + 3] << 24);
      let arrayOptions = options;

      // Stop index
      const stopIndex = index + objectSize;

      // All elements of array to be returned as raw bson
      if (fieldsAsRaw && fieldsAsRaw[name]) {
        arrayOptions = {};
        for (const n in options) {
          (arrayOptions as {
            [key: string]: DeserializeOptions[keyof DeserializeOptions];
          })[n] = options[n as keyof DeserializeOptions];
        }
        arrayOptions['raw'] = true;
      }

      value = deserializeObject(buffer, _index, arrayOptions, true);
      index = index + objectSize;

      if (buffer[index - 1] !== 0) throw new Error('invalid array terminator byte');
      if (index !== stopIndex) throw new Error('corrupted array bson');
    } else if (elementType === constants.BSON_DATA_UNDEFINED) {
      value = undefined;
    } else if (elementType === constants.BSON_DATA_NULL) {
      value = null;
    } else if (elementType === constants.BSON_DATA_LONG) {
      // Unpack the low and high bits
      const lowBits =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);
      const highBits =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);
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
    } else if (elementType === constants.BSON_DATA_DECIMAL128) {
      // Buffer to contain the decimal bytes
      const bytes = Buffer.alloc(16);
      // Copy the next 16 bytes into the bytes buffer
      buffer.copy(bytes, 0, index, index + 16);
      // Update index
      index = index + 16;
      // Assign the new Decimal128 value
      const decimal128 = new Decimal128(bytes) as Decimal128 | { toObject(): unknown };
      // If we have an alternative mapper use that
      if ('toObject' in decimal128 && typeof decimal128.toObject === 'function') {
        value = decimal128.toObject();
      } else {
        value = decimal128;
      }
    } else if (elementType === constants.BSON_DATA_BINARY) {
      let binarySize =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);
      const totalBinarySize = binarySize;
      const subType = buffer[index++];

      // Did we have a negative binary size, throw
      if (binarySize < 0) throw new Error('Negative binary type element size found');

      // Is the length longer than the document
      if (binarySize > buffer.byteLength)
        throw new Error('Binary type size larger than document size');

      // Decode as raw Buffer object if options specifies it
      if (buffer['slice'] != null) {
        // If we have subtype 2 skip the 4 bytes for the size
        if (subType === Binary.SUBTYPE_BYTE_ARRAY) {
          binarySize =
            buffer[index++] |
            (buffer[index++] << 8) |
            (buffer[index++] << 16) |
            (buffer[index++] << 24);
          if (binarySize < 0)
            throw new Error('Negative binary type element size found for subtype 0x02');
          if (binarySize > totalBinarySize - 4)
            throw new Error('Binary type with subtype 0x02 contains too long binary size');
          if (binarySize < totalBinarySize - 4)
            throw new Error('Binary type with subtype 0x02 contains too short binary size');
        }

        if (promoteBuffers && promoteValues) {
          value = buffer.slice(index, index + binarySize);
        } else {
          value = new Binary(buffer.slice(index, index + binarySize), subType);
        }
      } else {
        const _buffer = Buffer.alloc(binarySize);
        // If we have subtype 2 skip the 4 bytes for the size
        if (subType === Binary.SUBTYPE_BYTE_ARRAY) {
          binarySize =
            buffer[index++] |
            (buffer[index++] << 8) |
            (buffer[index++] << 16) |
            (buffer[index++] << 24);
          if (binarySize < 0)
            throw new Error('Negative binary type element size found for subtype 0x02');
          if (binarySize > totalBinarySize - 4)
            throw new Error('Binary type with subtype 0x02 contains too long binary size');
          if (binarySize < totalBinarySize - 4)
            throw new Error('Binary type with subtype 0x02 contains too short binary size');
        }

        // Copy the data
        for (i = 0; i < binarySize; i++) {
          _buffer[i] = buffer[index + i];
        }

        if (promoteBuffers && promoteValues) {
          value = _buffer;
        } else {
          value = new Binary(_buffer, subType);
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
      if (i >= buffer.length) throw new Error('Bad BSON Document: illegal CString');
      // Return the C string
      const source = buffer.toString('utf8', index, i);
      // Create the regexp
      index = i + 1;

      // Get the start search index
      i = index;
      // Locate the end of the c string
      while (buffer[i] !== 0x00 && i < buffer.length) {
        i++;
      }
      // If are at the end of the buffer there is a problem with the document
      if (i >= buffer.length) throw new Error('Bad BSON Document: illegal CString');
      // Return the C string
      const regExpOptions = buffer.toString('utf8', index, i);
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
      if (i >= buffer.length) throw new Error('Bad BSON Document: illegal CString');
      // Return the C string
      const source = buffer.toString('utf8', index, i);
      index = i + 1;

      // Get the start search index
      i = index;
      // Locate the end of the c string
      while (buffer[i] !== 0x00 && i < buffer.length) {
        i++;
      }
      // If are at the end of the buffer there is a problem with the document
      if (i >= buffer.length) throw new Error('Bad BSON Document: illegal CString');
      // Return the C string
      const regExpOptions = buffer.toString('utf8', index, i);
      index = i + 1;

      // Set the object
      value = new BSONRegExp(source, regExpOptions);
    } else if (elementType === constants.BSON_DATA_SYMBOL) {
      const stringSize =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);
      if (
        stringSize <= 0 ||
        stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      )
        throw new Error('bad string length in bson');
      const symbol = buffer.toString('utf8', index, index + stringSize - 1);
      value = promoteValues ? symbol : new BSONSymbol(symbol);
      index = index + stringSize;
    } else if (elementType === constants.BSON_DATA_TIMESTAMP) {
      const lowBits =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);
      const highBits =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);

      value = new Timestamp(lowBits, highBits);
    } else if (elementType === constants.BSON_DATA_MIN_KEY) {
      value = new MinKey();
    } else if (elementType === constants.BSON_DATA_MAX_KEY) {
      value = new MaxKey();
    } else if (elementType === constants.BSON_DATA_CODE) {
      const stringSize =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);
      if (
        stringSize <= 0 ||
        stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      )
        throw new Error('bad string length in bson');
      const functionString = buffer.toString('utf8', index, index + stringSize - 1);

      // If we are evaluating the functions
      if (evalFunctions) {
        // If we have cache enabled let's look for the md5 of the function in the cache
        if (cacheFunctions) {
          // Got to do this to avoid V8 deoptimizing the call due to finding eval
          value = isolateEval(functionString, functionCache, object);
        } else {
          value = isolateEval(functionString);
        }
      } else {
        value = new Code(functionString);
      }

      // Update parse index position
      index = index + stringSize;
    } else if (elementType === constants.BSON_DATA_CODE_W_SCOPE) {
      const totalSize =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);

      // Element cannot be shorter than totalSize + stringSize + documentSize + terminator
      if (totalSize < 4 + 4 + 4 + 1) {
        throw new Error('code_w_scope total size shorter minimum expected length');
      }

      // Get the code string size
      const stringSize =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);
      // Check if we have a valid string
      if (
        stringSize <= 0 ||
        stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      )
        throw new Error('bad string length in bson');

      // Javascript function
      const functionString = buffer.toString('utf8', index, index + stringSize - 1);
      // Update parse index position
      index = index + stringSize;
      // Parse the element
      const _index = index;
      // Decode the size of the object document
      const objectSize =
        buffer[index] |
        (buffer[index + 1] << 8) |
        (buffer[index + 2] << 16) |
        (buffer[index + 3] << 24);
      // Decode the scope object
      const scopeObject = deserializeObject(buffer, _index, options, false);
      // Adjust the index
      index = index + objectSize;

      // Check if field length is too short
      if (totalSize < 4 + 4 + objectSize + stringSize) {
        throw new Error('code_w_scope total size is too short, truncating scope');
      }

      // Check if totalSize field is too long
      if (totalSize > 4 + 4 + objectSize + stringSize) {
        throw new Error('code_w_scope total size is too long, clips outer document');
      }

      // If we are evaluating the functions
      if (evalFunctions) {
        // If we have cache enabled let's look for the md5 of the function in the cache
        if (cacheFunctions) {
          // Got to do this to avoid V8 deoptimizing the call due to finding eval
          value = isolateEval(functionString, functionCache, object);
        } else {
          value = isolateEval(functionString);
        }

        value.scope = scopeObject;
      } else {
        value = new Code(functionString, scopeObject);
      }
    } else if (elementType === constants.BSON_DATA_DBPOINTER) {
      // Get the code string size
      const stringSize =
        buffer[index++] |
        (buffer[index++] << 8) |
        (buffer[index++] << 16) |
        (buffer[index++] << 24);
      // Check if we have a valid string
      if (
        stringSize <= 0 ||
        stringSize > buffer.length - index ||
        buffer[index + stringSize - 1] !== 0
      )
        throw new Error('bad string length in bson');
      // Namespace
      if (!validateUtf8(buffer, index, index + stringSize - 1)) {
        throw new Error('Invalid UTF-8 string in BSON document');
      }
      const namespace = buffer.toString('utf8', index, index + stringSize - 1);
      // Update parse index position
      index = index + stringSize;

      // Read the oid
      const oidBuffer = Buffer.alloc(12);
      buffer.copy(oidBuffer, 0, index, index + 12);
      const oid = new ObjectId(oidBuffer);

      // Update the index
      index = index + 12;

      // Upgrade to DBRef type
      value = new DBRef(namespace, oid);
    } else {
      throw new Error(
        'Detected unknown BSON type ' + elementType.toString(16) + ' for fieldname "' + name + '"'
      );
    }
    if (name === '__proto__') {
      Object.defineProperty(object, name, {
        value,
        writable: true,
        enumerable: true,
        configurable: true
      });
    } else {
      object[name] = value;
    }
  }

  // Check if the deserialization was against a valid array/object
  if (size !== index - startIndex) {
    if (isArray) throw new Error('corrupt array bson');
    throw new Error('corrupt object bson');
  }

  // check if object's $ keys are those of a DBRef
  const dollarKeys = Object.keys(object).filter(k => k.startsWith('$'));
  let valid = true;
  dollarKeys.forEach(k => {
    if (['$ref', '$id', '$db'].indexOf(k) === -1) valid = false;
  });

  // if a $key not in "$ref", "$id", "$db", don't make a DBRef
  if (!valid) return object;

  if (isDBRefLike(object)) {
    const copy = Object.assign({}, object) as Partial<DBRefLike>;
    delete copy.$ref;
    delete copy.$id;
    delete copy.$db;
    return new DBRef(object.$ref, object.$id, object.$db, copy);
  }

  return object;
}

/**
 * Ensure eval is isolated, store the result in functionCache.
 *
 * @internal
 */
function isolateEval(
  functionString: string,
  functionCache?: { [hash: string]: Function },
  object?: Document
) {
  if (!functionCache) return new Function(functionString);
  // Check for cache hit, eval if missing and return cached function
  if (functionCache[functionString] == null) {
    functionCache[functionString] = new Function(functionString);
  }

  // Set the object
  return functionCache[functionString].bind(object);
}
