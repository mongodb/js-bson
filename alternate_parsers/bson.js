var Long = require('../lib/bson/long').Long,
  Double = require('../lib/bson/double').Double,
  Timestamp = require('../lib/bson/timestamp').Timestamp,
  ObjectID = require('../lib/bson/objectid').ObjectID,
  Symbol = require('../lib/bson/symbol').Symbol,
  Code = require('../lib/bson/code').Code,
  MinKey = require('../lib/bson/min_key').MinKey,
  MaxKey = require('../lib/bson/max_key').MaxKey,
  DBRef = require('../lib/bson/db_ref').DBRef,
  Binary = require('../lib/bson/binary').Binary,
  BinaryParser = require('../lib/bson/binary_parser').BinaryParser,
  writeIEEE754 = require('../lib/bson/float_parser').writeIEEE754,
  readIEEE754 = require('../lib/bson/float_parser').readIEEE754;

// To ensure that 0.4 of node works correctly
var isDate = function isDate(d) {
  return typeof d === 'object' && Object.prototype.toString.call(d) === '[object Date]';
};

/**
 * Create a new BSON instance
 *
 * @class
 * @return {BSON} instance of BSON Parser.
 */
function BSON() {}

/**
 * @ignore
 * @api private
 */
// BSON MAX VALUES
BSON.BSON_INT32_MAX = 0x7fffffff;
BSON.BSON_INT32_MIN = -0x80000000;

BSON.BSON_INT64_MAX = Math.pow(2, 63) - 1;
BSON.BSON_INT64_MIN = -Math.pow(2, 63);

// JS MAX PRECISE VALUES
BSON.JS_INT_MAX = 0x20000000000000; // Any integer up to 2^53 can be precisely represented by a double.
BSON.JS_INT_MIN = -0x20000000000000; // Any integer down to -2^53 can be precisely represented by a double.

// Internal long versions
var JS_INT_MAX_LONG = Long.fromNumber(0x20000000000000); // Any integer up to 2^53 can be precisely represented by a double.
var JS_INT_MIN_LONG = Long.fromNumber(-0x20000000000000); // Any integer down to -2^53 can be precisely represented by a double.

/**
 * Number BSON Type
 *
 * @classconstant BSON_DATA_NUMBER
 **/
BSON.BSON_DATA_NUMBER = 1;
/**
 * String BSON Type
 *
 * @classconstant BSON_DATA_STRING
 **/
BSON.BSON_DATA_STRING = 2;
/**
 * Object BSON Type
 *
 * @classconstant BSON_DATA_OBJECT
 **/
BSON.BSON_DATA_OBJECT = 3;
/**
 * Array BSON Type
 *
 * @classconstant BSON_DATA_ARRAY
 **/
BSON.BSON_DATA_ARRAY = 4;
/**
 * Binary BSON Type
 *
 * @classconstant BSON_DATA_BINARY
 **/
BSON.BSON_DATA_BINARY = 5;
/**
 * Binary BSON Type
 *
 * @classconstant BSON_DATA_UNDEFINED
 **/
BSON.BSON_DATA_UNDEFINED = 6;
/**
 * ObjectID BSON Type
 *
 * @classconstant BSON_DATA_OID
 **/
BSON.BSON_DATA_OID = 7;
/**
 * Boolean BSON Type
 *
 * @classconstant BSON_DATA_BOOLEAN
 **/
BSON.BSON_DATA_BOOLEAN = 8;
/**
 * Date BSON Type
 *
 * @classconstant BSON_DATA_DATE
 **/
BSON.BSON_DATA_DATE = 9;
/**
 * null BSON Type
 *
 * @classconstant BSON_DATA_NULL
 **/
BSON.BSON_DATA_NULL = 10;
/**
 * RegExp BSON Type
 *
 * @classconstant BSON_DATA_REGEXP
 **/
BSON.BSON_DATA_REGEXP = 11;
/**
 * Code BSON Type
 *
 * @classconstant BSON_DATA_CODE
 **/
BSON.BSON_DATA_CODE = 13;
/**
 * Symbol BSON Type
 *
 * @classconstant BSON_DATA_SYMBOL
 **/
BSON.BSON_DATA_SYMBOL = 14;
/**
 * Code with Scope BSON Type
 *
 * @classconstant BSON_DATA_CODE_W_SCOPE
 **/
BSON.BSON_DATA_CODE_W_SCOPE = 15;
/**
 * 32 bit Integer BSON Type
 *
 * @classconstant BSON_DATA_INT
 **/
BSON.BSON_DATA_INT = 16;
/**
 * Timestamp BSON Type
 *
 * @classconstant BSON_DATA_TIMESTAMP
 **/
BSON.BSON_DATA_TIMESTAMP = 17;
/**
 * Long BSON Type
 *
 * @classconstant BSON_DATA_LONG
 **/
BSON.BSON_DATA_LONG = 18;
/**
 * MinKey BSON Type
 *
 * @classconstant BSON_DATA_MIN_KEY
 **/
BSON.BSON_DATA_MIN_KEY = 0xff;
/**
 * MaxKey BSON Type
 *
 * @classconstant BSON_DATA_MAX_KEY
 **/
BSON.BSON_DATA_MAX_KEY = 0x7f;

/**
 * Binary Default Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_DEFAULT
 **/
BSON.BSON_BINARY_SUBTYPE_DEFAULT = 0;
/**
 * Binary Function Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_FUNCTION
 **/
BSON.BSON_BINARY_SUBTYPE_FUNCTION = 1;
/**
 * Binary Byte Array Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_BYTE_ARRAY
 **/
BSON.BSON_BINARY_SUBTYPE_BYTE_ARRAY = 2;
/**
 * Binary UUID Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_UUID
 **/
BSON.BSON_BINARY_SUBTYPE_UUID = 3;
/**
 * Binary MD5 Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_MD5
 **/
BSON.BSON_BINARY_SUBTYPE_MD5 = 4;
/**
 * Binary User Defined Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_USER_DEFINED
 **/
BSON.BSON_BINARY_SUBTYPE_USER_DEFINED = 128;

/**
 * Calculate the bson size for a passed in Javascript object.
 *
 * @param {Object} object the Javascript object to calculate the BSON byte size for.
 * @param {Boolean} [serializeFunctions] serialize all functions in the object **(default:false)**.
 * @return {Number} returns the number of bytes the BSON object will take up.
 * @api public
 */
BSON.calculateObjectSize = function calculateObjectSize(object, serializeFunctions) {
  var totalLength = 4 + 1;

  if (Array.isArray(object)) {
    for (var i = 0; i < object.length; i++) {
      totalLength += calculateElement(i.toString(), object[i], serializeFunctions);
    }
  } else {
    // If we have toBSON defined, override the current object
    if (object.toBSON) {
      object = object.toBSON();
    }

    // Calculate size
    for (var key in object) {
      totalLength += calculateElement(key, object[key], serializeFunctions);
    }
  }

  return totalLength;
};

/**
 * @ignore
 * @api private
 */
function calculateElement(name, value, serializeFunctions) {
  var isBuffer = typeof Buffer !== 'undefined';

  // If we have toBSON defined, override the current object
  if (value && value.toBSON) {
    value = value.toBSON();
  }

  switch (typeof value) {
    case 'string':
      return (
        1 +
        (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) +
        1 +
        4 +
        (!isBuffer ? numberOfBytes(value) : Buffer.byteLength(value, 'utf8')) +
        1
      );
    case 'number':
      if (Math.floor(value) === value && value >= BSON.JS_INT_MIN && value <= BSON.JS_INT_MAX) {
        if (value >= BSON.BSON_INT32_MIN && value <= BSON.BSON_INT32_MAX) {
          // 32 bit
          return (
            (name != null
              ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
              : 0) +
            (4 + 1)
          );
        } else {
          return (
            (name != null
              ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
              : 0) +
            (8 + 1)
          );
        }
      } else {
        // 64 bit
        return (
          (name != null
            ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
            : 0) +
          (8 + 1)
        );
      }
    case 'undefined':
      return (
        (name != null
          ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
          : 0) + 1
      );
    case 'boolean':
      return (
        (name != null
          ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
          : 0) +
        (1 + 1)
      );
    case 'object':
      if (
        value == null ||
        value instanceof MinKey ||
        value instanceof MaxKey ||
        value['_bsontype'] === 'MinKey' ||
        value['_bsontype'] === 'MaxKey'
      ) {
        return (
          (name != null
            ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
            : 0) + 1
        );
      } else if (value instanceof ObjectID || value['_bsontype'] === 'ObjectID') {
        return (
          (name != null
            ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
            : 0) +
          (12 + 1)
        );
      } else if (value instanceof Date || isDate(value)) {
        return (
          (name != null
            ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
            : 0) +
          (8 + 1)
        );
      } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
        return (
          (name != null
            ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
            : 0) +
          (1 + 4 + 1) +
          value.length
        );
      } else if (
        value instanceof Long ||
        value instanceof Double ||
        value instanceof Timestamp ||
        value['_bsontype'] === 'Long' ||
        value['_bsontype'] === 'Double' ||
        value['_bsontype'] === 'Timestamp'
      ) {
        return (
          (name != null
            ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
            : 0) +
          (8 + 1)
        );
      } else if (value instanceof Code || value['_bsontype'] === 'Code') {
        // Calculate size depending on the availability of a scope
        if (value.scope != null && Object.keys(value.scope).length > 0) {
          return (
            (name != null
              ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
              : 0) +
            1 +
            4 +
            4 +
            (!isBuffer
              ? numberOfBytes(value.code.toString())
              : Buffer.byteLength(value.code.toString(), 'utf8')) +
            1 +
            BSON.calculateObjectSize(value.scope, serializeFunctions)
          );
        } else {
          return (
            (name != null
              ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
              : 0) +
            1 +
            4 +
            (!isBuffer
              ? numberOfBytes(value.code.toString())
              : Buffer.byteLength(value.code.toString(), 'utf8')) +
            1
          );
        }
      } else if (value instanceof Binary || value['_bsontype'] === 'Binary') {
        // Check what kind of subtype we have
        if (value.sub_type === Binary.SUBTYPE_BYTE_ARRAY) {
          return (
            (name != null
              ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
              : 0) +
            (value.position + 1 + 4 + 1 + 4)
          );
        } else {
          return (
            (name != null
              ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
              : 0) +
            (value.position + 1 + 4 + 1)
          );
        }
      } else if (value instanceof Symbol || value['_bsontype'] === 'Symbol') {
        return (
          (name != null
            ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
            : 0) +
          ((!isBuffer ? numberOfBytes(value.value) : Buffer.byteLength(value.value, 'utf8')) +
            4 +
            1 +
            1)
        );
      } else if (value instanceof DBRef || value['_bsontype'] === 'DBRef') {
        // Set up correct object for serialization
        var ordered_values = {
          $ref: value.namespace,
          $id: value.oid
        };

        // Add db reference if it exists
        if (null != value.db) {
          ordered_values['$db'] = value.db;
        }

        return (
          (name != null
            ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
            : 0) +
          1 +
          BSON.calculateObjectSize(ordered_values, serializeFunctions)
        );
      } else if (
        value instanceof RegExp ||
        Object.prototype.toString.call(value) === '[object RegExp]'
      ) {
        return (
          (name != null
            ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
            : 0) +
          1 +
          (!isBuffer ? numberOfBytes(value.source) : Buffer.byteLength(value.source, 'utf8')) +
          1 +
          (value.global ? 1 : 0) +
          (value.ignoreCase ? 1 : 0) +
          (value.multiline ? 1 : 0) +
          1
        );
      } else {
        return (
          (name != null
            ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
            : 0) +
          BSON.calculateObjectSize(value, serializeFunctions) +
          1
        );
      }
    case 'function':
      // WTF for 0.4.X where typeof /someregexp/ === 'function'
      if (
        value instanceof RegExp ||
        Object.prototype.toString.call(value) === '[object RegExp]' ||
        String.call(value) === '[object RegExp]'
      ) {
        return (
          (name != null
            ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
            : 0) +
          1 +
          (!isBuffer ? numberOfBytes(value.source) : Buffer.byteLength(value.source, 'utf8')) +
          1 +
          (value.global ? 1 : 0) +
          (value.ignoreCase ? 1 : 0) +
          (value.multiline ? 1 : 0) +
          1
        );
      } else {
        if (serializeFunctions && value.scope != null && Object.keys(value.scope).length > 0) {
          return (
            (name != null
              ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
              : 0) +
            1 +
            4 +
            4 +
            (!isBuffer
              ? numberOfBytes(value.toString())
              : Buffer.byteLength(value.toString(), 'utf8')) +
            1 +
            BSON.calculateObjectSize(value.scope, serializeFunctions)
          );
        } else if (serializeFunctions) {
          return (
            (name != null
              ? (!isBuffer ? numberOfBytes(name) : Buffer.byteLength(name, 'utf8')) + 1
              : 0) +
            1 +
            4 +
            (!isBuffer
              ? numberOfBytes(value.toString())
              : Buffer.byteLength(value.toString(), 'utf8')) +
            1
          );
        }
      }
  }

  return 0;
}

/**
 * Serialize a Javascript object using a predefined Buffer and index into the buffer, useful when pre-allocating the space for serialization.
 *
 * @param {Object} object the Javascript object to serialize.
 * @param {Boolean} checkKeys the serializer will check if keys are valid.
 * @param {Buffer} buffer the Buffer you pre-allocated to store the serialized BSON object.
 * @param {Number} index the index in the buffer where we wish to start serializing into.
 * @param {Boolean} serializeFunctions serialize the javascript functions **(default:false)**.
 * @return {Number} returns the new write index in the Buffer.
 * @api public
 */
BSON.serializeWithBufferAndIndex = function serializeWithBufferAndIndex(
  object,
  checkKeys,
  buffer,
  index,
  serializeFunctions
) {
  // Default setting false
  serializeFunctions = serializeFunctions == null ? false : serializeFunctions;
  // Write end information (length of the object)
  var size = buffer.length;
  // Write the size of the object
  buffer[index++] = size & 0xff;
  buffer[index++] = (size >> 8) & 0xff;
  buffer[index++] = (size >> 16) & 0xff;
  buffer[index++] = (size >> 24) & 0xff;
  return serializeObject(object, checkKeys, buffer, index, serializeFunctions) - 1;
};

/**
 * @ignore
 * @api private
 */
var serializeObject = function(object, checkKeys, buffer, index, serializeFunctions) {
  if (object.toBSON) {
    if (typeof object.toBSON !== 'function') throw new Error('toBSON is not a function');
    object = object.toBSON();
    if (object != null && typeof object !== 'object')
      throw new Error('toBSON function did not return an object');
  }

  // Process the object
  if (Array.isArray(object)) {
    for (var i = 0; i < object.length; i++) {
      index = packElement(i.toString(), object[i], checkKeys, buffer, index, serializeFunctions);
    }
  } else {
    // If we have toBSON defined, override the current object
    if (object.toBSON) {
      object = object.toBSON();
    }

    // Serialize the object
    for (var key in object) {
      // Check the key and throw error if it's illegal
      if (key !== '$db' && key !== '$ref' && key !== '$id') {
        // dollars and dots ok
        BSON.checkKey(key, !checkKeys);
      }

      // Pack the element
      index = packElement(key, object[key], checkKeys, buffer, index, serializeFunctions);
    }
  }

  // Write zero
  buffer[index++] = 0;
  return index;
};

var stringToBytes = function(str) {
  var ch,
    st,
    re = [];
  for (var i = 0; i < str.length; i++) {
    ch = str.charCodeAt(i); // get char
    st = []; // set up "stack"
    do {
      st.push(ch & 0xff); // push byte to stack
      ch = ch >> 8; // shift value down by 1 byte
    } while (ch);
    // add stack contents to result
    // done because chars have "wrong" endianness
    re = re.concat(st.reverse());
  }
  // return an array of bytes
  return re;
};

var numberOfBytes = function(str) {
  var ch,
    st,
    re = 0;
  for (var i = 0; i < str.length; i++) {
    ch = str.charCodeAt(i); // get char
    st = []; // set up "stack"
    do {
      st.push(ch & 0xff); // push byte to stack
      ch = ch >> 8; // shift value down by 1 byte
    } while (ch);
    // add stack contents to result
    // done because chars have "wrong" endianness
    re = re + st.length;
  }
  // return an array of bytes
  return re;
};

/**
 * @ignore
 * @api private
 */
var writeToTypedArray = function(buffer, string, index) {
  var bytes = stringToBytes(string);
  for (var i = 0; i < bytes.length; i++) {
    buffer[index + i] = bytes[i];
  }
  return bytes.length;
};

/**
 * @ignore
 * @api private
 */
var supportsBuffer = typeof Buffer !== 'undefined';

/**
 * @ignore
 * @api private
 */
var packElement = function(name, value, checkKeys, buffer, index, serializeFunctions) {
  // If we have toBSON defined, override the current object
  if (value && value.toBSON) {
    value = value.toBSON();
  }

  switch (typeof value) {
    case 'string':
      // console.log("+++++++++++ index string:: " + index)
      // Encode String type
      buffer[index++] = BSON.BSON_DATA_STRING;
      // Number of written bytes
      var numberOfWrittenBytes = supportsBuffer
        ? buffer.write(name, index, 'utf8')
        : writeToTypedArray(buffer, name, index);
      // Encode the name
      index = index + numberOfWrittenBytes + 1;
      buffer[index - 1] = 0;

      // Calculate size
      var size = supportsBuffer ? Buffer.byteLength(value) + 1 : numberOfBytes(value) + 1;
      // console.log("====== key :: " + name + " size ::" + size)
      // Write the size of the string to buffer
      buffer[index + 3] = (size >> 24) & 0xff;
      buffer[index + 2] = (size >> 16) & 0xff;
      buffer[index + 1] = (size >> 8) & 0xff;
      buffer[index] = size & 0xff;
      // Ajust the index
      index = index + 4;
      // Write the string
      supportsBuffer ? buffer.write(value, index, 'utf8') : writeToTypedArray(buffer, value, index);
      // Update index
      index = index + size - 1;
      // Write zero
      buffer[index++] = 0;
      // Return index
      return index;
    case 'number':
      // We have an integer value
      if (Math.floor(value) === value && value >= BSON.JS_INT_MIN && value <= BSON.JS_INT_MAX) {
        // If the value fits in 32 bits encode as int, if it fits in a double
        // encode it as a double, otherwise long
        if (value >= BSON.BSON_INT32_MIN && value <= BSON.BSON_INT32_MAX) {
          // Set int type 32 bits or less
          buffer[index++] = BSON.BSON_DATA_INT;
          // Number of written bytes
          numberOfWrittenBytes = supportsBuffer
            ? buffer.write(name, index, 'utf8')
            : writeToTypedArray(buffer, name, index);
          // Encode the name
          index = index + numberOfWrittenBytes + 1;
          buffer[index - 1] = 0;
          // Write the int value
          buffer[index++] = value & 0xff;
          buffer[index++] = (value >> 8) & 0xff;
          buffer[index++] = (value >> 16) & 0xff;
          buffer[index++] = (value >> 24) & 0xff;
        } else if (value >= BSON.JS_INT_MIN && value <= BSON.JS_INT_MAX) {
          // Encode as double
          buffer[index++] = BSON.BSON_DATA_NUMBER;
          // Number of written bytes
          numberOfWrittenBytes = supportsBuffer
            ? buffer.write(name, index, 'utf8')
            : writeToTypedArray(buffer, name, index);
          // Encode the name
          index = index + numberOfWrittenBytes + 1;
          buffer[index - 1] = 0;
          // Write float
          writeIEEE754(buffer, value, index, 'little', 52, 8);
          // Ajust index
          index = index + 8;
        } else {
          // Set long type
          buffer[index++] = BSON.BSON_DATA_LONG;
          // Number of written bytes
          numberOfWrittenBytes = supportsBuffer
            ? buffer.write(name, index, 'utf8')
            : writeToTypedArray(buffer, name, index);
          // Encode the name
          index = index + numberOfWrittenBytes + 1;
          buffer[index - 1] = 0;
          var longVal = Long.fromNumber(value);
          var lowBits = longVal.getLowBits();
          var highBits = longVal.getHighBits();
          // Encode low bits
          buffer[index++] = lowBits & 0xff;
          buffer[index++] = (lowBits >> 8) & 0xff;
          buffer[index++] = (lowBits >> 16) & 0xff;
          buffer[index++] = (lowBits >> 24) & 0xff;
          // Encode high bits
          buffer[index++] = highBits & 0xff;
          buffer[index++] = (highBits >> 8) & 0xff;
          buffer[index++] = (highBits >> 16) & 0xff;
          buffer[index++] = (highBits >> 24) & 0xff;
        }
      } else {
        // Encode as double
        buffer[index++] = BSON.BSON_DATA_NUMBER;
        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Encode the name
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;
        // Write float
        writeIEEE754(buffer, value, index, 'little', 52, 8);
        // Ajust index
        index = index + 8;
      }

      return index;
    case 'undefined':
      // Set long type
      buffer[index++] = BSON.BSON_DATA_NULL;
      // Number of written bytes
      numberOfWrittenBytes = supportsBuffer
        ? buffer.write(name, index, 'utf8')
        : writeToTypedArray(buffer, name, index);
      // Encode the name
      index = index + numberOfWrittenBytes + 1;
      buffer[index - 1] = 0;
      return index;
    case 'boolean':
      // Write the type
      buffer[index++] = BSON.BSON_DATA_BOOLEAN;
      // Number of written bytes
      numberOfWrittenBytes = supportsBuffer
        ? buffer.write(name, index, 'utf8')
        : writeToTypedArray(buffer, name, index);
      // Encode the name
      index = index + numberOfWrittenBytes + 1;
      buffer[index - 1] = 0;
      // Encode the boolean value
      buffer[index++] = value ? 1 : 0;
      return index;
    case 'object':
      if (
        value === null ||
        value instanceof MinKey ||
        value instanceof MaxKey ||
        value['_bsontype'] === 'MinKey' ||
        value['_bsontype'] === 'MaxKey'
      ) {
        // Write the type of either min or max key
        if (value === null) {
          buffer[index++] = BSON.BSON_DATA_NULL;
        } else if (value instanceof MinKey) {
          buffer[index++] = BSON.BSON_DATA_MIN_KEY;
        } else {
          buffer[index++] = BSON.BSON_DATA_MAX_KEY;
        }

        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Encode the name
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;
        return index;
      } else if (value instanceof ObjectID || value['_bsontype'] === 'ObjectID') {
        // console.log("+++++++++++ index OBJECTID:: " + index)
        // Write the type
        buffer[index++] = BSON.BSON_DATA_OID;
        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Encode the name
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;

        // Write objectid
        supportsBuffer
          ? buffer.write(value.id, index, 'binary')
          : writeToTypedArray(buffer, value.id, index);
        // Ajust index
        index = index + 12;
        return index;
      } else if (value instanceof Date || isDate(value)) {
        // Write the type
        buffer[index++] = BSON.BSON_DATA_DATE;
        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Encode the name
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;

        // Write the date
        var dateInMilis = Long.fromNumber(value.getTime());
        lowBits = dateInMilis.getLowBits();
        highBits = dateInMilis.getHighBits();
        // Encode low bits
        buffer[index++] = lowBits & 0xff;
        buffer[index++] = (lowBits >> 8) & 0xff;
        buffer[index++] = (lowBits >> 16) & 0xff;
        buffer[index++] = (lowBits >> 24) & 0xff;
        // Encode high bits
        buffer[index++] = highBits & 0xff;
        buffer[index++] = (highBits >> 8) & 0xff;
        buffer[index++] = (highBits >> 16) & 0xff;
        buffer[index++] = (highBits >> 24) & 0xff;
        return index;
      } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
        // Write the type
        buffer[index++] = BSON.BSON_DATA_BINARY;
        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Encode the name
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;
        // Get size of the buffer (current write point)
        size = value.length;
        // Write the size of the string to buffer
        buffer[index++] = size & 0xff;
        buffer[index++] = (size >> 8) & 0xff;
        buffer[index++] = (size >> 16) & 0xff;
        buffer[index++] = (size >> 24) & 0xff;
        // Write the default subtype
        buffer[index++] = BSON.BSON_BINARY_SUBTYPE_DEFAULT;
        // Copy the content form the binary field to the buffer
        value.copy(buffer, index, 0, size);
        // Adjust the index
        index = index + size;
        return index;
      } else if (
        value instanceof Long ||
        value instanceof Timestamp ||
        value['_bsontype'] === 'Long' ||
        value['_bsontype'] === 'Timestamp'
      ) {
        // Write the type
        buffer[index++] =
          value instanceof Long || value['_bsontype'] === 'Long'
            ? BSON.BSON_DATA_LONG
            : BSON.BSON_DATA_TIMESTAMP;
        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Encode the name
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;
        // Write the date
        lowBits = value.getLowBits();
        highBits = value.getHighBits();
        // Encode low bits
        buffer[index++] = lowBits & 0xff;
        buffer[index++] = (lowBits >> 8) & 0xff;
        buffer[index++] = (lowBits >> 16) & 0xff;
        buffer[index++] = (lowBits >> 24) & 0xff;
        // Encode high bits
        buffer[index++] = highBits & 0xff;
        buffer[index++] = (highBits >> 8) & 0xff;
        buffer[index++] = (highBits >> 16) & 0xff;
        buffer[index++] = (highBits >> 24) & 0xff;
        return index;
      } else if (value instanceof Double || value['_bsontype'] === 'Double') {
        // Encode as double
        buffer[index++] = BSON.BSON_DATA_NUMBER;
        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Encode the name
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;
        // Write float
        writeIEEE754(buffer, value, index, 'little', 52, 8);
        // Ajust index
        index = index + 8;
        return index;
      } else if (value instanceof Code || value['_bsontype'] === 'Code') {
        if (value.scope != null && Object.keys(value.scope).length > 0) {
          // Write the type
          buffer[index++] = BSON.BSON_DATA_CODE_W_SCOPE;
          // Number of written bytes
          numberOfWrittenBytes = supportsBuffer
            ? buffer.write(name, index, 'utf8')
            : writeToTypedArray(buffer, name, index);
          // Encode the name
          index = index + numberOfWrittenBytes + 1;
          buffer[index - 1] = 0;
          // Calculate the scope size
          var scopeSize = BSON.calculateObjectSize(value.scope, serializeFunctions);
          // Function string
          var functionString = value.code.toString();
          // Function Size
          var codeSize = supportsBuffer
            ? Buffer.byteLength(functionString) + 1
            : numberOfBytes(functionString) + 1;

          // Calculate full size of the object
          var totalSize = 4 + codeSize + scopeSize + 4;

          // Write the total size of the object
          buffer[index++] = totalSize & 0xff;
          buffer[index++] = (totalSize >> 8) & 0xff;
          buffer[index++] = (totalSize >> 16) & 0xff;
          buffer[index++] = (totalSize >> 24) & 0xff;

          // Write the size of the string to buffer
          buffer[index++] = codeSize & 0xff;
          buffer[index++] = (codeSize >> 8) & 0xff;
          buffer[index++] = (codeSize >> 16) & 0xff;
          buffer[index++] = (codeSize >> 24) & 0xff;

          // Write the string
          supportsBuffer
            ? buffer.write(functionString, index, 'utf8')
            : writeToTypedArray(buffer, functionString, index);
          // Update index
          index = index + codeSize - 1;
          // Write zero
          buffer[index++] = 0;
          // Serialize the scope object
          var scopeObjectBuffer = supportsBuffer
            ? new Buffer(scopeSize)
            : new Uint8Array(new ArrayBuffer(scopeSize));
          // Execute the serialization into a seperate buffer
          serializeObject(value.scope, checkKeys, scopeObjectBuffer, 0, serializeFunctions);

          // Adjusted scope Size (removing the header)
          var scopeDocSize = scopeSize;
          // Write scope object size
          buffer[index++] = scopeDocSize & 0xff;
          buffer[index++] = (scopeDocSize >> 8) & 0xff;
          buffer[index++] = (scopeDocSize >> 16) & 0xff;
          buffer[index++] = (scopeDocSize >> 24) & 0xff;

          // Write the scopeObject into the buffer
          supportsBuffer
            ? scopeObjectBuffer.copy(buffer, index, 0, scopeSize)
            : buffer.set(scopeObjectBuffer, index);
          // Adjust index, removing the empty size of the doc (5 bytes 0000000005)
          index = index + scopeDocSize - 5;
          // Write trailing zero
          buffer[index++] = 0;
          return index;
        } else {
          buffer[index++] = BSON.BSON_DATA_CODE;
          // Number of written bytes
          numberOfWrittenBytes = supportsBuffer
            ? buffer.write(name, index, 'utf8')
            : writeToTypedArray(buffer, name, index);
          // Encode the name
          index = index + numberOfWrittenBytes + 1;
          buffer[index - 1] = 0;
          // Function string
          functionString = value.code.toString();
          // Function Size
          size = supportsBuffer
            ? Buffer.byteLength(functionString) + 1
            : numberOfBytes(functionString) + 1;
          // Write the size of the string to buffer
          buffer[index++] = size & 0xff;
          buffer[index++] = (size >> 8) & 0xff;
          buffer[index++] = (size >> 16) & 0xff;
          buffer[index++] = (size >> 24) & 0xff;
          // Write the string
          supportsBuffer
            ? buffer.write(functionString, index, 'utf8')
            : writeToTypedArray(buffer, functionString, index);
          // Update index
          index = index + size - 1;
          // Write zero
          buffer[index++] = 0;
          return index;
        }
      } else if (value instanceof Binary || value['_bsontype'] === 'Binary') {
        // Write the type
        buffer[index++] = BSON.BSON_DATA_BINARY;
        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Encode the name
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;
        // Extract the buffer
        var data = value.value(true);
        // Calculate size
        size = value.position;
        // Write the size of the string to buffer
        buffer[index++] = size & 0xff;
        buffer[index++] = (size >> 8) & 0xff;
        buffer[index++] = (size >> 16) & 0xff;
        buffer[index++] = (size >> 24) & 0xff;
        // Write the subtype to the buffer
        buffer[index++] = value.sub_type;

        // If we have binary type 2 the 4 first bytes are the size
        if (value.sub_type === Binary.SUBTYPE_BYTE_ARRAY) {
          buffer[index++] = size & 0xff;
          buffer[index++] = (size >> 8) & 0xff;
          buffer[index++] = (size >> 16) & 0xff;
          buffer[index++] = (size >> 24) & 0xff;
        }

        // Write the data to the object
        supportsBuffer ? data.copy(buffer, index, 0, value.position) : buffer.set(data, index);
        // Ajust index
        index = index + value.position;
        return index;
      } else if (value instanceof Symbol || value['_bsontype'] === 'Symbol') {
        // Write the type
        buffer[index++] = BSON.BSON_DATA_SYMBOL;
        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Encode the name
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;
        // Calculate size
        size = supportsBuffer ? Buffer.byteLength(value.value) + 1 : numberOfBytes(value.value) + 1;
        // Write the size of the string to buffer
        buffer[index++] = size & 0xff;
        buffer[index++] = (size >> 8) & 0xff;
        buffer[index++] = (size >> 16) & 0xff;
        buffer[index++] = (size >> 24) & 0xff;
        // Write the string
        buffer.write(value.value, index, 'utf8');
        // Update index
        index = index + size - 1;
        // Write zero
        buffer[index++] = 0x00;
        return index;
      } else if (value instanceof DBRef || value['_bsontype'] === 'DBRef') {
        // Write the type
        buffer[index++] = BSON.BSON_DATA_OBJECT;
        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Encode the name
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;
        // Set up correct object for serialization
        var ordered_values = {
          $ref: value.namespace,
          $id: value.oid
        };

        // Add db reference if it exists
        if (null != value.db) {
          ordered_values['$db'] = value.db;
        }

        // Message size
        size = BSON.calculateObjectSize(ordered_values, serializeFunctions);
        // Serialize the object
        var endIndex = BSON.serializeWithBufferAndIndex(
          ordered_values,
          checkKeys,
          buffer,
          index,
          serializeFunctions
        );
        // Write the size of the string to buffer
        buffer[index++] = size & 0xff;
        buffer[index++] = (size >> 8) & 0xff;
        buffer[index++] = (size >> 16) & 0xff;
        buffer[index++] = (size >> 24) & 0xff;
        // Write zero for object
        buffer[endIndex++] = 0x00;
        // Return the end index
        return endIndex;
      } else if (
        value instanceof RegExp ||
        Object.prototype.toString.call(value) === '[object RegExp]'
      ) {
        // Write the type
        buffer[index++] = BSON.BSON_DATA_REGEXP;
        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Encode the name
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;

        // Write the regular expression string
        supportsBuffer
          ? buffer.write(value.source, index, 'utf8')
          : writeToTypedArray(buffer, value.source, index);
        // Adjust the index
        index =
          index + (supportsBuffer ? Buffer.byteLength(value.source) : numberOfBytes(value.source));
        // Write zero
        buffer[index++] = 0x00;
        // Write the parameters
        if (value.global) buffer[index++] = 0x73; // s
        if (value.ignoreCase) buffer[index++] = 0x69; // i
        if (value.multiline) buffer[index++] = 0x6d; // m
        // Add ending zero
        buffer[index++] = 0x00;
        return index;
      } else {
        // Write the type
        buffer[index++] = Array.isArray(value) ? BSON.BSON_DATA_ARRAY : BSON.BSON_DATA_OBJECT;
        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Adjust the index
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;
        endIndex = serializeObject(value, checkKeys, buffer, index + 4, serializeFunctions);
        // Write size
        size = endIndex - index;
        // Write the size of the string to buffer
        buffer[index++] = size & 0xff;
        buffer[index++] = (size >> 8) & 0xff;
        buffer[index++] = (size >> 16) & 0xff;
        buffer[index++] = (size >> 24) & 0xff;
        return endIndex;
      }
    case 'function':
      // WTF for 0.4.X where typeof /someregexp/ === 'function'
      if (
        value instanceof RegExp ||
        Object.prototype.toString.call(value) === '[object RegExp]' ||
        String.call(value) === '[object RegExp]'
      ) {
        // Write the type
        buffer[index++] = BSON.BSON_DATA_REGEXP;
        // Number of written bytes
        numberOfWrittenBytes = supportsBuffer
          ? buffer.write(name, index, 'utf8')
          : writeToTypedArray(buffer, name, index);
        // Encode the name
        index = index + numberOfWrittenBytes + 1;
        buffer[index - 1] = 0;

        // Write the regular expression string
        buffer.write(value.source, index, 'utf8');
        // Adjust the index
        index =
          index + (supportsBuffer ? Buffer.byteLength(value.source) : numberOfBytes(value.source));
        // Write zero
        buffer[index++] = 0x00;
        // Write the parameters
        if (value.global) buffer[index++] = 0x73; // s
        if (value.ignoreCase) buffer[index++] = 0x69; // i
        if (value.multiline) buffer[index++] = 0x6d; // m
        // Add ending zero
        buffer[index++] = 0x00;
        return index;
      } else {
        if (serializeFunctions && value.scope != null && Object.keys(value.scope).length > 0) {
          // Write the type
          buffer[index++] = BSON.BSON_DATA_CODE_W_SCOPE;
          // Number of written bytes
          numberOfWrittenBytes = supportsBuffer
            ? buffer.write(name, index, 'utf8')
            : writeToTypedArray(buffer, name, index);
          // Encode the name
          index = index + numberOfWrittenBytes + 1;
          buffer[index - 1] = 0;
          // Calculate the scope size
          scopeSize = BSON.calculateObjectSize(value.scope, serializeFunctions);
          // Function string
          functionString = value.toString();
          // Function Size
          codeSize = supportsBuffer
            ? Buffer.byteLength(functionString) + 1
            : numberOfBytes(functionString) + 1;

          // Calculate full size of the object
          totalSize = 4 + codeSize + scopeSize;

          // Write the total size of the object
          buffer[index++] = totalSize & 0xff;
          buffer[index++] = (totalSize >> 8) & 0xff;
          buffer[index++] = (totalSize >> 16) & 0xff;
          buffer[index++] = (totalSize >> 24) & 0xff;

          // Write the size of the string to buffer
          buffer[index++] = codeSize & 0xff;
          buffer[index++] = (codeSize >> 8) & 0xff;
          buffer[index++] = (codeSize >> 16) & 0xff;
          buffer[index++] = (codeSize >> 24) & 0xff;

          // Write the string
          supportsBuffer
            ? buffer.write(functionString, index, 'utf8')
            : writeToTypedArray(buffer, functionString, index);
          // Update index
          index = index + codeSize - 1;
          // Write zero
          buffer[index++] = 0;
          // Serialize the scope object
          scopeObjectBuffer = new Buffer(scopeSize);
          // Execute the serialization into a seperate buffer
          serializeObject(value.scope, checkKeys, scopeObjectBuffer, 0, serializeFunctions);

          // Adjusted scope Size (removing the header)
          scopeDocSize = scopeSize - 4;
          // Write scope object size
          buffer[index++] = scopeDocSize & 0xff;
          buffer[index++] = (scopeDocSize >> 8) & 0xff;
          buffer[index++] = (scopeDocSize >> 16) & 0xff;
          buffer[index++] = (scopeDocSize >> 24) & 0xff;

          // Write the scopeObject into the buffer
          scopeObjectBuffer.copy(buffer, index, 0, scopeSize);

          // Adjust index, removing the empty size of the doc (5 bytes 0000000005)
          index = index + scopeDocSize - 5;
          // Write trailing zero
          buffer[index++] = 0;
          return index;
        } else if (serializeFunctions) {
          buffer[index++] = BSON.BSON_DATA_CODE;
          // Number of written bytes
          numberOfWrittenBytes = supportsBuffer
            ? buffer.write(name, index, 'utf8')
            : writeToTypedArray(buffer, name, index);
          // Encode the name
          index = index + numberOfWrittenBytes + 1;
          buffer[index - 1] = 0;
          // Function string
          functionString = value.toString();
          // Function Size
          size = supportsBuffer
            ? Buffer.byteLength(functionString) + 1
            : numberOfBytes(functionString) + 1;
          // Write the size of the string to buffer
          buffer[index++] = size & 0xff;
          buffer[index++] = (size >> 8) & 0xff;
          buffer[index++] = (size >> 16) & 0xff;
          buffer[index++] = (size >> 24) & 0xff;
          // Write the string
          supportsBuffer
            ? buffer.write(functionString, index, 'utf8')
            : writeToTypedArray(buffer, functionString, index);
          // Update index
          index = index + size - 1;
          // Write zero
          buffer[index++] = 0;
          return index;
        }
      }
  }

  // If no value to serialize
  return index;
};

/**
 * Serialize a Javascript object.
 *
 * @param {Object} object the Javascript object to serialize.
 * @param {Boolean} checkKeys the serializer will check if keys are valid.
 * @param {Boolean} asBuffer return the serialized object as a Buffer object **(ignore)**.
 * @param {Boolean} serializeFunctions serialize the javascript functions **(default:false)**.
 * @return {Buffer} returns the Buffer object containing the serialized object.
 * @api public
 */
BSON.serialize = function(object, checkKeys, asBuffer, serializeFunctions) {
  // Throw error if we are trying serialize an illegal type
  if (object == null || typeof object !== 'object' || Array.isArray(object))
    throw new Error('Only javascript objects supported');

  // Emoty target buffer
  var buffer = null;
  // Calculate the size of the object
  var size = BSON.calculateObjectSize(object, serializeFunctions);
  // Fetch the best available type for storing the binary data
  if ((buffer = typeof Buffer !== 'undefined')) {
    buffer = new Buffer(size);
    asBuffer = true;
  } else if (typeof Uint8Array !== 'undefined') {
    buffer = new Uint8Array(new ArrayBuffer(size));
  } else {
    buffer = new Array(size);
  }

  // If asBuffer is false use typed arrays
  BSON.serializeWithBufferAndIndex(object, checkKeys, buffer, 0, serializeFunctions);
  // console.log("++++++++++++++++++++++++++++++++++++ OLDJS :: " + buffer.length)
  // console.log(buffer.toString('hex'))
  // console.log(buffer.toString('ascii'))
  return buffer;
};

/**
 * Contains the function cache if we have that enable to allow for avoiding the eval step on each deserialization, comparison is by md5
 *
 * @ignore
 * @api private
 */
var functionCache = (BSON.functionCache = {});

/**
 * Crc state variables shared by function
 *
 * @ignore
 * @api private
 */
var table = [
  0x00000000,
  0x77073096,
  0xee0e612c,
  0x990951ba,
  0x076dc419,
  0x706af48f,
  0xe963a535,
  0x9e6495a3,
  0x0edb8832,
  0x79dcb8a4,
  0xe0d5e91e,
  0x97d2d988,
  0x09b64c2b,
  0x7eb17cbd,
  0xe7b82d07,
  0x90bf1d91,
  0x1db71064,
  0x6ab020f2,
  0xf3b97148,
  0x84be41de,
  0x1adad47d,
  0x6ddde4eb,
  0xf4d4b551,
  0x83d385c7,
  0x136c9856,
  0x646ba8c0,
  0xfd62f97a,
  0x8a65c9ec,
  0x14015c4f,
  0x63066cd9,
  0xfa0f3d63,
  0x8d080df5,
  0x3b6e20c8,
  0x4c69105e,
  0xd56041e4,
  0xa2677172,
  0x3c03e4d1,
  0x4b04d447,
  0xd20d85fd,
  0xa50ab56b,
  0x35b5a8fa,
  0x42b2986c,
  0xdbbbc9d6,
  0xacbcf940,
  0x32d86ce3,
  0x45df5c75,
  0xdcd60dcf,
  0xabd13d59,
  0x26d930ac,
  0x51de003a,
  0xc8d75180,
  0xbfd06116,
  0x21b4f4b5,
  0x56b3c423,
  0xcfba9599,
  0xb8bda50f,
  0x2802b89e,
  0x5f058808,
  0xc60cd9b2,
  0xb10be924,
  0x2f6f7c87,
  0x58684c11,
  0xc1611dab,
  0xb6662d3d,
  0x76dc4190,
  0x01db7106,
  0x98d220bc,
  0xefd5102a,
  0x71b18589,
  0x06b6b51f,
  0x9fbfe4a5,
  0xe8b8d433,
  0x7807c9a2,
  0x0f00f934,
  0x9609a88e,
  0xe10e9818,
  0x7f6a0dbb,
  0x086d3d2d,
  0x91646c97,
  0xe6635c01,
  0x6b6b51f4,
  0x1c6c6162,
  0x856530d8,
  0xf262004e,
  0x6c0695ed,
  0x1b01a57b,
  0x8208f4c1,
  0xf50fc457,
  0x65b0d9c6,
  0x12b7e950,
  0x8bbeb8ea,
  0xfcb9887c,
  0x62dd1ddf,
  0x15da2d49,
  0x8cd37cf3,
  0xfbd44c65,
  0x4db26158,
  0x3ab551ce,
  0xa3bc0074,
  0xd4bb30e2,
  0x4adfa541,
  0x3dd895d7,
  0xa4d1c46d,
  0xd3d6f4fb,
  0x4369e96a,
  0x346ed9fc,
  0xad678846,
  0xda60b8d0,
  0x44042d73,
  0x33031de5,
  0xaa0a4c5f,
  0xdd0d7cc9,
  0x5005713c,
  0x270241aa,
  0xbe0b1010,
  0xc90c2086,
  0x5768b525,
  0x206f85b3,
  0xb966d409,
  0xce61e49f,
  0x5edef90e,
  0x29d9c998,
  0xb0d09822,
  0xc7d7a8b4,
  0x59b33d17,
  0x2eb40d81,
  0xb7bd5c3b,
  0xc0ba6cad,
  0xedb88320,
  0x9abfb3b6,
  0x03b6e20c,
  0x74b1d29a,
  0xead54739,
  0x9dd277af,
  0x04db2615,
  0x73dc1683,
  0xe3630b12,
  0x94643b84,
  0x0d6d6a3e,
  0x7a6a5aa8,
  0xe40ecf0b,
  0x9309ff9d,
  0x0a00ae27,
  0x7d079eb1,
  0xf00f9344,
  0x8708a3d2,
  0x1e01f268,
  0x6906c2fe,
  0xf762575d,
  0x806567cb,
  0x196c3671,
  0x6e6b06e7,
  0xfed41b76,
  0x89d32be0,
  0x10da7a5a,
  0x67dd4acc,
  0xf9b9df6f,
  0x8ebeeff9,
  0x17b7be43,
  0x60b08ed5,
  0xd6d6a3e8,
  0xa1d1937e,
  0x38d8c2c4,
  0x4fdff252,
  0xd1bb67f1,
  0xa6bc5767,
  0x3fb506dd,
  0x48b2364b,
  0xd80d2bda,
  0xaf0a1b4c,
  0x36034af6,
  0x41047a60,
  0xdf60efc3,
  0xa867df55,
  0x316e8eef,
  0x4669be79,
  0xcb61b38c,
  0xbc66831a,
  0x256fd2a0,
  0x5268e236,
  0xcc0c7795,
  0xbb0b4703,
  0x220216b9,
  0x5505262f,
  0xc5ba3bbe,
  0xb2bd0b28,
  0x2bb45a92,
  0x5cb36a04,
  0xc2d7ffa7,
  0xb5d0cf31,
  0x2cd99e8b,
  0x5bdeae1d,
  0x9b64c2b0,
  0xec63f226,
  0x756aa39c,
  0x026d930a,
  0x9c0906a9,
  0xeb0e363f,
  0x72076785,
  0x05005713,
  0x95bf4a82,
  0xe2b87a14,
  0x7bb12bae,
  0x0cb61b38,
  0x92d28e9b,
  0xe5d5be0d,
  0x7cdcefb7,
  0x0bdbdf21,
  0x86d3d2d4,
  0xf1d4e242,
  0x68ddb3f8,
  0x1fda836e,
  0x81be16cd,
  0xf6b9265b,
  0x6fb077e1,
  0x18b74777,
  0x88085ae6,
  0xff0f6a70,
  0x66063bca,
  0x11010b5c,
  0x8f659eff,
  0xf862ae69,
  0x616bffd3,
  0x166ccf45,
  0xa00ae278,
  0xd70dd2ee,
  0x4e048354,
  0x3903b3c2,
  0xa7672661,
  0xd06016f7,
  0x4969474d,
  0x3e6e77db,
  0xaed16a4a,
  0xd9d65adc,
  0x40df0b66,
  0x37d83bf0,
  0xa9bcae53,
  0xdebb9ec5,
  0x47b2cf7f,
  0x30b5ffe9,
  0xbdbdf21c,
  0xcabac28a,
  0x53b39330,
  0x24b4a3a6,
  0xbad03605,
  0xcdd70693,
  0x54de5729,
  0x23d967bf,
  0xb3667a2e,
  0xc4614ab8,
  0x5d681b02,
  0x2a6f2b94,
  0xb40bbe37,
  0xc30c8ea1,
  0x5a05df1b,
  0x2d02ef8d
];

/**
 * CRC32 hash method, Fast and enough versitility for our usage
 *
 * @ignore
 * @api private
 */
var crc32 = function(string, start, end) {
  var crc = 0;
  var x = 0;
  var y = 0;
  crc = crc ^ -1;

  for (var i = start, iTop = end; i < iTop; i++) {
    y = (crc ^ string[i]) & 0xff;
    x = table[y];
    crc = (crc >>> 8) ^ x;
  }

  return crc ^ -1;
};

/**
 * Deserialize stream data as BSON documents.
 *
 * Options
 *  - **evalFunctions** {Boolean, default:false}, evaluate functions in the BSON document scoped to the object deserialized.
 *  - **cacheFunctions** {Boolean, default:false}, cache evaluated functions for reuse.
 *  - **cacheFunctionsCrc32** {Boolean, default:false}, use a crc32 code for caching, otherwise use the string of the function.
 *  - **promoteLongs** {Boolean, default:true}, when deserializing a Long will fit it into a Number if it's smaller than 53 bits
 *
 * @param {Buffer} data the buffer containing the serialized set of BSON documents.
 * @param {Number} startIndex the start index in the data Buffer where the deserialization is to start.
 * @param {Number} numberOfDocuments number of documents to deserialize.
 * @param {Array} documents an array where to store the deserialized documents.
 * @param {Number} docStartIndex the index in the documents array from where to start inserting documents.
 * @param {Object} [options] additional options used for the deserialization.
 * @return {Number} returns the next index in the buffer after deserialization **x** numbers of documents.
 * @api public
 */
BSON.deserializeStream = function(
  data,
  startIndex,
  numberOfDocuments,
  documents,
  docStartIndex,
  options
) {
  // if(numberOfDocuments !== documents.length) throw new Error("Number of expected results back is less than the number of documents");
  options = options != null ? options : {};
  var index = startIndex;
  // Loop over all documents
  for (var i = 0; i < numberOfDocuments; i++) {
    // Find size of the document
    var size =
      data[index] | (data[index + 1] << 8) | (data[index + 2] << 16) | (data[index + 3] << 24);
    // Update options with index
    options['index'] = index;
    // Parse the document at this point
    documents[docStartIndex + i] = BSON.deserialize(data, options);
    // Adjust index by the document size
    index = index + size;
  }

  // Return object containing end index of parsing and list of documents
  return index;
};

/**
 * Ensure eval is isolated.
 *
 * @ignore
 * @api private
 */
var isolateEvalWithHash = function(functionCache, hash, functionString, object) {
  // Contains the value we are going to set
  var value = null;

  // Check for cache hit, eval if missing and return cached function
  if (functionCache[hash] == null) {
    eval('value = ' + functionString);
    functionCache[hash] = value;
  }
  // Set the object
  return functionCache[hash].bind(object);
};

/**
 * Ensure eval is isolated.
 *
 * @ignore
 * @api private
 */
var isolateEval = function(functionString) {
  // Contains the value we are going to set
  var value = null;
  // Eval the function
  eval('value = ' + functionString);
  return value;
};

/**
 * Convert Uint8Array to String
 *
 * @ignore
 * @api private
 */
var convertUint8ArrayToUtf8String = function(byteArray, startIndex, endIndex) {
  return BinaryParser.decode_utf8(convertArraytoUtf8BinaryString(byteArray, startIndex, endIndex));
};

var convertArraytoUtf8BinaryString = function(byteArray, startIndex, endIndex) {
  var result = '';
  for (var i = startIndex; i < endIndex; i++) {
    result = result + String.fromCharCode(byteArray[i]);
  }

  return result;
};

/**
 * Deserialize data as BSON.
 *
 * Options
 *  - **evalFunctions** {Boolean, default:false}, evaluate functions in the BSON document scoped to the object deserialized.
 *  - **cacheFunctions** {Boolean, default:false}, cache evaluated functions for reuse.
 *  - **cacheFunctionsCrc32** {Boolean, default:false}, use a crc32 code for caching, otherwise use the string of the function.
 *  - **promoteLongs** {Boolean, default:true}, when deserializing a Long will fit it into a Number if it's smaller than 53 bits
 *
 * @param {Buffer} buffer the buffer containing the serialized set of BSON documents.
 * @param {Object} [options] additional options used for the deserialization.
 * @param {Boolean} [isArray] ignore used for recursive parsing.
 * @return {Object} returns the deserialized Javascript Object.
 * @api public
 */
BSON.deserialize = function(buffer, options, isArray) {
  // Options
  options = options == null ? {} : options;
  var evalFunctions = options['evalFunctions'] == null ? false : options['evalFunctions'];
  var cacheFunctions = options['cacheFunctions'] == null ? false : options['cacheFunctions'];
  var cacheFunctionsCrc32 =
    options['cacheFunctionsCrc32'] == null ? false : options['cacheFunctionsCrc32'];
  var promoteLongs = options['promoteLongs'] == null ? true : options['promoteLongs'];

  // Validate that we have at least 4 bytes of buffer
  if (buffer.length < 5) throw new Error('corrupt bson message < 5 bytes long');

  // Set up index
  var index = typeof options['index'] === 'number' ? options['index'] : 0;
  // Reads in a C style string
  var readCStyleString = function() {
    // Get the start search index
    var i = index;
    // Locate the end of the c string
    while (buffer[i] !== 0x00 && i < buffer.length) {
      i++;
    }
    // If are at the end of the buffer there is a problem with the document
    if (i >= buffer.length) throw new Error('Bad BSON Document: illegal CString');
    // Grab utf8 encoded string
    var string =
      supportsBuffer && Buffer.isBuffer(buffer)
        ? buffer.toString('utf8', index, i)
        : convertUint8ArrayToUtf8String(buffer, index, i);
    // Update index position
    index = i + 1;
    // Return string
    return string;
  };

  // Create holding object
  var object = isArray ? [] : {};

  // Read the document size
  var size =
    buffer[index++] | (buffer[index++] << 8) | (buffer[index++] << 16) | (buffer[index++] << 24);

  // Ensure buffer is valid size
  if (size < 5 || size > buffer.length) throw new Error('corrupt bson message');

  // While we have more left data left keep parsing
  while (true) {
    // Read the type
    var elementType = buffer[index++];
    // If we get a zero it's the last byte, exit
    if (elementType === 0) break;
    // Read the name of the field
    var name = readCStyleString();
    // Switch on the type
    switch (elementType) {
      case BSON.BSON_DATA_OID:
        var string =
          supportsBuffer && Buffer.isBuffer(buffer)
            ? buffer.toString('binary', index, index + 12)
            : convertArraytoUtf8BinaryString(buffer, index, index + 12);
        // Decode the oid
        object[name] = new ObjectID(string);
        // Update index
        index = index + 12;
        break;
      case BSON.BSON_DATA_STRING:
        // Read the content of the field
        var stringSize =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        // Add string to object
        object[name] =
          supportsBuffer && Buffer.isBuffer(buffer)
            ? buffer.toString('utf8', index, index + stringSize - 1)
            : convertUint8ArrayToUtf8String(buffer, index, index + stringSize - 1);
        // Update parse index position
        index = index + stringSize;
        break;
      case BSON.BSON_DATA_INT:
        // Decode the 32bit value
        object[name] =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        break;
      case BSON.BSON_DATA_NUMBER:
        // Decode the double value
        object[name] = readIEEE754(buffer, index, 'little', 52, 8);
        // Update the index
        index = index + 8;
        break;
      case BSON.BSON_DATA_DATE:
        // Unpack the low and high bits
        var lowBits =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        var highBits =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        // Set date object
        object[name] = new Date(new Long(lowBits, highBits).toNumber());
        break;
      case BSON.BSON_DATA_BOOLEAN:
        // Parse the boolean value
        object[name] = buffer[index++] === 1;
        break;
      case BSON.BSON_DATA_UNDEFINED:
      case BSON.BSON_DATA_NULL:
        // Parse the boolean value
        object[name] = null;
        break;
      case BSON.BSON_DATA_BINARY:
        // Decode the size of the binary blob
        var binarySize =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        // Decode the subtype
        var subType = buffer[index++];
        // Decode as raw Buffer object if options specifies it
        if (buffer['slice'] != null) {
          // If we have subtype 2 skip the 4 bytes for the size
          if (subType === Binary.SUBTYPE_BYTE_ARRAY) {
            binarySize =
              buffer[index++] |
              (buffer[index++] << 8) |
              (buffer[index++] << 16) |
              (buffer[index++] << 24);
          }
          // Slice the data
          object[name] = new Binary(buffer.slice(index, index + binarySize), subType);
        } else {
          var _buffer =
            typeof Uint8Array !== 'undefined'
              ? new Uint8Array(new ArrayBuffer(binarySize))
              : new Array(binarySize);
          // If we have subtype 2 skip the 4 bytes for the size
          if (subType === Binary.SUBTYPE_BYTE_ARRAY) {
            binarySize =
              buffer[index++] |
              (buffer[index++] << 8) |
              (buffer[index++] << 16) |
              (buffer[index++] << 24);
          }
          // Copy the data
          for (var i = 0; i < binarySize; i++) {
            _buffer[i] = buffer[index + i];
          }
          // Create the binary object
          object[name] = new Binary(_buffer, subType);
        }
        // Update the index
        index = index + binarySize;
        break;
      case BSON.BSON_DATA_ARRAY:
        options['index'] = index;
        // Decode the size of the array document
        var objectSize =
          buffer[index] |
          (buffer[index + 1] << 8) |
          (buffer[index + 2] << 16) |
          (buffer[index + 3] << 24);
        // Set the array to the object
        object[name] = BSON.deserialize(buffer, options, true);
        // Adjust the index
        index = index + objectSize;
        break;
      case BSON.BSON_DATA_OBJECT:
        options['index'] = index;
        // Decode the size of the object document
        objectSize =
          buffer[index] |
          (buffer[index + 1] << 8) |
          (buffer[index + 2] << 16) |
          (buffer[index + 3] << 24);
        // Set the array to the object
        object[name] = BSON.deserialize(buffer, options, false);
        // Adjust the index
        index = index + objectSize;
        break;
      case BSON.BSON_DATA_REGEXP:
        // Create the regexp
        var source = readCStyleString();
        var regExpOptions = readCStyleString();
        // For each option add the corresponding one for javascript
        var optionsArray = new Array(regExpOptions.length);

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

        object[name] = new RegExp(source, optionsArray.join(''));
        break;
      case BSON.BSON_DATA_LONG:
        // Unpack the low and high bits
        lowBits =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        highBits =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        // Create long object
        var long = new Long(lowBits, highBits);
        // Promote the long if possible
        if (promoteLongs) {
          object[name] =
            long.lessThanOrEqual(JS_INT_MAX_LONG) && long.greaterThanOrEqual(JS_INT_MIN_LONG)
              ? long.toNumber()
              : long;
        } else {
          object[name] = long;
        }
        break;
      case BSON.BSON_DATA_SYMBOL:
        // Read the content of the field
        stringSize =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        // Add string to object
        object[name] = new Symbol(buffer.toString('utf8', index, index + stringSize - 1));
        // Update parse index position
        index = index + stringSize;
        break;
      case BSON.BSON_DATA_TIMESTAMP:
        // Unpack the low and high bits
        lowBits =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        highBits =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        // Set the object
        object[name] = new Timestamp(lowBits, highBits);
        break;
      case BSON.BSON_DATA_MIN_KEY:
        // Parse the object
        object[name] = new MinKey();
        break;
      case BSON.BSON_DATA_MAX_KEY:
        // Parse the object
        object[name] = new MaxKey();
        break;
      case BSON.BSON_DATA_CODE:
        // Read the content of the field
        stringSize =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        // Function string
        var functionString =
          supportsBuffer && Buffer.isBuffer(buffer)
            ? buffer.toString('utf8', index, index + stringSize - 1)
            : convertUint8ArrayToUtf8String(buffer, index, index + stringSize - 1);

        // If we are evaluating the functions
        if (evalFunctions) {
          // Contains the value we are going to set
          value = null;
          // If we have cache enabled let's look for the md5 of the function in the cache
          if (cacheFunctions) {
            var hash = cacheFunctionsCrc32 ? crc32(functionString) : functionString;
            // Got to do this to avoid V8 deoptimizing the call due to finding eval
            object[name] = isolateEvalWithHash(functionCache, hash, functionString, object);
          } else {
            // Set directly
            object[name] = isolateEval(functionString);
          }
        } else {
          object[name] = new Code(functionString, {});
        }

        // Update parse index position
        index = index + stringSize;
        break;
      case BSON.BSON_DATA_CODE_W_SCOPE:
        // Read the content of the field
        totalSize =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        stringSize =
          buffer[index++] |
          (buffer[index++] << 8) |
          (buffer[index++] << 16) |
          (buffer[index++] << 24);
        // Javascript function
        functionString =
          supportsBuffer && Buffer.isBuffer(buffer)
            ? buffer.toString('utf8', index, index + stringSize - 1)
            : convertUint8ArrayToUtf8String(buffer, index, index + stringSize - 1);
        // Update parse index position
        index = index + stringSize;
        // Parse the element
        options['index'] = index;
        // Decode the size of the object document
        objectSize =
          buffer[index] |
          (buffer[index + 1] << 8) |
          (buffer[index + 2] << 16) |
          (buffer[index + 3] << 24);
        // Decode the scope object
        var scopeObject = BSON.deserialize(buffer, options, false);
        // Adjust the index
        index = index + objectSize;

        // If we are evaluating the functions
        if (evalFunctions) {
          // If we have cache enabled let's look for the md5 of the function in the cache
          if (cacheFunctions) {
            hash = cacheFunctionsCrc32 ? crc32(functionString) : functionString;
            // Got to do this to avoid V8 deoptimizing the call due to finding eval
            object[name] = isolateEvalWithHash(functionCache, hash, functionString, object);
          } else {
            // Set directly
            object[name] = isolateEval(functionString);
          }

          // Set the scope on the object
          object[name].scope = scopeObject;
        } else {
          object[name] = new Code(functionString, scopeObject);
        }

        // Add string to object
        break;
    }
  }

  // Check if we have a db ref object
  if (object['$id'] != null) object = new DBRef(object['$ref'], object['$id'], object['$db']);

  // Return the final objects
  return object;
};

/**
 * Check if key name is valid.
 *
 * @ignore
 * @api private
 */
BSON.checkKey = function checkKey(key, dollarsAndDotsOk) {
  if (!key.length) return;
  // Check if we have a legal key for the object
  if (~key.indexOf('\x00')) {
    // The BSON spec doesn't allow keys with null bytes because keys are
    // null-terminated.
    throw Error('key ' + key + ' must not contain null bytes');
  }
  if (!dollarsAndDotsOk) {
    if ('$' === key[0]) {
      throw Error('key ' + key + " must not start with '$'");
    } else if (~key.indexOf('.')) {
      throw Error('key ' + key + " must not contain '.'");
    }
  }
};

/**
 * Deserialize data as BSON.
 *
 * Options
 *  - **evalFunctions** {Boolean, default:false}, evaluate functions in the BSON document scoped to the object deserialized.
 *  - **cacheFunctions** {Boolean, default:false}, cache evaluated functions for reuse.
 *  - **cacheFunctionsCrc32** {Boolean, default:false}, use a crc32 code for caching, otherwise use the string of the function.
 *
 * @param {Buffer} buffer the buffer containing the serialized set of BSON documents.
 * @param {Object} [options] additional options used for the deserialization.
 * @param {Boolean} [isArray] ignore used for recursive parsing.
 * @return {Object} returns the deserialized Javascript Object.
 * @api public
 */
BSON.prototype.deserialize = function(data, options) {
  return BSON.deserialize(data, options);
};

/**
 * Deserialize stream data as BSON documents.
 *
 * Options
 *  - **evalFunctions** {Boolean, default:false}, evaluate functions in the BSON document scoped to the object deserialized.
 *  - **cacheFunctions** {Boolean, default:false}, cache evaluated functions for reuse.
 *  - **cacheFunctionsCrc32** {Boolean, default:false}, use a crc32 code for caching, otherwise use the string of the function.
 *
 * @param {Buffer} data the buffer containing the serialized set of BSON documents.
 * @param {Number} startIndex the start index in the data Buffer where the deserialization is to start.
 * @param {Number} numberOfDocuments number of documents to deserialize.
 * @param {Array} documents an array where to store the deserialized documents.
 * @param {Number} docStartIndex the index in the documents array from where to start inserting documents.
 * @param {Object} [options] additional options used for the deserialization.
 * @return {Number} returns the next index in the buffer after deserialization **x** numbers of documents.
 * @api public
 */
BSON.prototype.deserializeStream = function(
  data,
  startIndex,
  numberOfDocuments,
  documents,
  docStartIndex,
  options
) {
  return BSON.deserializeStream(
    data,
    startIndex,
    numberOfDocuments,
    documents,
    docStartIndex,
    options
  );
};

/**
 * Serialize a Javascript object.
 *
 * @param {Object} object the Javascript object to serialize.
 * @param {Boolean} checkKeys the serializer will check if keys are valid.
 * @param {Boolean} asBuffer return the serialized object as a Buffer object **(ignore)**.
 * @param {Boolean} serializeFunctions serialize the javascript functions **(default:false)**.
 * @return {Buffer} returns the Buffer object containing the serialized object.
 * @api public
 */
BSON.prototype.serialize = function(object, checkKeys, asBuffer, serializeFunctions) {
  return BSON.serialize(object, checkKeys, asBuffer, serializeFunctions);
};

/**
 * Calculate the bson size for a passed in Javascript object.
 *
 * @param {Object} object the Javascript object to calculate the BSON byte size for.
 * @param {Boolean} [serializeFunctions] serialize all functions in the object **(default:false)**.
 * @return {Number} returns the number of bytes the BSON object will take up.
 * @api public
 */
BSON.prototype.calculateObjectSize = function(object, serializeFunctions) {
  return BSON.calculateObjectSize(object, serializeFunctions);
};

/**
 * Serialize a Javascript object using a predefined Buffer and index into the buffer, useful when pre-allocating the space for serialization.
 *
 * @param {Object} object the Javascript object to serialize.
 * @param {Boolean} checkKeys the serializer will check if keys are valid.
 * @param {Buffer} buffer the Buffer you pre-allocated to store the serialized BSON object.
 * @param {Number} index the index in the buffer where we wish to start serializing into.
 * @param {Boolean} serializeFunctions serialize the javascript functions **(default:false)**.
 * @return {Number} returns the new write index in the Buffer.
 * @api public
 */
BSON.prototype.serializeWithBufferAndIndex = function(
  object,
  checkKeys,
  buffer,
  startIndex,
  serializeFunctions
) {
  return BSON.serializeWithBufferAndIndex(
    object,
    checkKeys,
    buffer,
    startIndex,
    serializeFunctions
  );
};

/**
 * @ignore
 * @api private
 */
module.exports = BSON;
module.exports.Code = Code;
module.exports.Symbol = Symbol;
module.exports.BSON = BSON;
module.exports.DBRef = DBRef;
module.exports.Binary = Binary;
module.exports.ObjectID = ObjectID;
module.exports.Long = Long;
module.exports.Timestamp = Timestamp;
module.exports.Double = Double;
module.exports.MinKey = MinKey;
module.exports.MaxKey = MaxKey;
