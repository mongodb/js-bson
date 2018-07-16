'use strict';

const Buffer = require('buffer').Buffer;
const Map = require('./map');
const Long = require('./long');
const Double = require('./double');
const Timestamp = require('./timestamp');
const ObjectID = require('./objectid');
const BSONRegExp = require('./regexp');
const Symbol = require('./symbol');
const Int32 = require('./int_32');
const Code = require('./code');
const Decimal128 = require('./decimal128');
const MinKey = require('./min_key');
const MaxKey = require('./max_key');
const DBRef = require('./db_ref');
const Binary = require('./binary');

// Parts of the parser
const internalDeserialize = require('./parser/deserializer');
const internalSerialize = require('./parser/serializer');
const internalCalculateObjectSize = require('./parser/calculate_size');
const ensureBuffer = require('./ensure_buffer');

/**
 * @ignore
 * @api private
 */
// Default Max Size
const MAXSIZE = 1024 * 1024 * 17;

// Current Internal Temporary Serialization Buffer
let buffer = new Buffer(MAXSIZE);

/**
 * Sets the size of the internal serialization buffer.
 *
 * @param {number} size The desired size for the internal serialization buffer
 */
function setInternalBufferSize(size) {
  // Resize the internal serialization buffer if needed
  if (buffer.length < size) {
    buffer = new Buffer(size);
  }
}

/**
 * Serialize a Javascript object.
 *
 * @param {Object} object the Javascript object to serialize.
 * @param {Boolean} [options.checkKeys] the serializer will check if keys are valid.
 * @param {Boolean} [options.serializeFunctions=false] serialize the javascript functions **(default:false)**.
 * @param {Boolean} [options.ignoreUndefined=true] ignore undefined fields **(default:true)**.
 * @return {Buffer} returns the Buffer object containing the serialized object.
 * @api public
 */
function serialize(object, options) {
  options = options || {};
  // Unpack the options
  const checkKeys = typeof options.checkKeys === 'boolean' ? options.checkKeys : false;
  const serializeFunctions =
    typeof options.serializeFunctions === 'boolean' ? options.serializeFunctions : false;
  const ignoreUndefined =
    typeof options.ignoreUndefined === 'boolean' ? options.ignoreUndefined : true;
  const minInternalBufferSize =
    typeof options.minInternalBufferSize === 'number' ? options.minInternalBufferSize : MAXSIZE;

  // Resize the internal serialization buffer if needed
  if (buffer.length < minInternalBufferSize) {
    buffer = new Buffer(minInternalBufferSize);
  }

  // Attempt to serialize
  const serializationIndex = internalSerialize(
    buffer,
    object,
    checkKeys,
    0,
    0,
    serializeFunctions,
    ignoreUndefined,
    []
  );

  // Create the final buffer
  const finishedBuffer = new Buffer(serializationIndex);

  // Copy into the finished buffer
  buffer.copy(finishedBuffer, 0, 0, finishedBuffer.length);

  // Return the buffer
  return finishedBuffer;
}

/**
 * Serialize a Javascript object using a predefined Buffer and index into the buffer, useful when pre-allocating the space for serialization.
 *
 * @param {Object} object the Javascript object to serialize.
 * @param {Buffer} buffer the Buffer you pre-allocated to store the serialized BSON object.
 * @param {Boolean} [options.checkKeys] the serializer will check if keys are valid.
 * @param {Boolean} [options.serializeFunctions=false] serialize the javascript functions **(default:false)**.
 * @param {Boolean} [options.ignoreUndefined=true] ignore undefined fields **(default:true)**.
 * @param {Number} [options.index] the index in the buffer where we wish to start serializing into.
 * @return {Number} returns the index pointing to the last written byte in the buffer.
 * @api public
 */
function serializeWithBufferAndIndex(object, finalBuffer, options) {
  options = options || {};
  // Unpack the options
  const checkKeys = typeof options.checkKeys === 'boolean' ? options.checkKeys : false;
  const serializeFunctions =
    typeof options.serializeFunctions === 'boolean' ? options.serializeFunctions : false;
  const ignoreUndefined =
    typeof options.ignoreUndefined === 'boolean' ? options.ignoreUndefined : true;
  const startIndex = typeof options.index === 'number' ? options.index : 0;

  // Attempt to serialize
  const serializationIndex = internalSerialize(
    buffer,
    object,
    checkKeys,
    0,
    0,
    serializeFunctions,
    ignoreUndefined
  );
  buffer.copy(finalBuffer, startIndex, 0, serializationIndex);

  // Return the index
  return startIndex + serializationIndex - 1;
}

/**
 * Deserialize data as BSON.
 *
 * @param {Buffer} buffer the buffer containing the serialized set of BSON documents.
 * @param {Object} [options.evalFunctions=false] evaluate functions in the BSON document scoped to the object deserialized.
 * @param {Object} [options.cacheFunctions=false] cache evaluated functions for reuse.
 * @param {Object} [options.cacheFunctionsCrc32=false] use a crc32 code for caching, otherwise use the string of the function.
 * @param {Object} [options.promoteLongs=true] when deserializing a Long will fit it into a Number if it's smaller than 53 bits
 * @param {Object} [options.promoteBuffers=false] when deserializing a Binary will return it as a node.js Buffer instance.
 * @param {Object} [options.promoteValues=false] when deserializing will promote BSON values to their Node.js closest equivalent types.
 * @param {Object} [options.fieldsAsRaw=null] allow to specify if there what fields we wish to return as unserialized raw buffer.
 * @param {Object} [options.bsonRegExp=false] return BSON regular expressions as BSONRegExp instances.
 * @param {boolean} [options.allowObjectSmallerThanBufferSize=false] allows the buffer to be larger than the parsed BSON object
 * @return {Object} returns the deserialized Javascript Object.
 * @api public
 */
function deserialize(buffer, options) {
  buffer = ensureBuffer(buffer);
  return internalDeserialize(buffer, options);
}

/**
 * Calculate the bson size for a passed in Javascript object.
 *
 * @param {Object} object the Javascript object to calculate the BSON byte size for.
 * @param {Boolean} [options.serializeFunctions=false] serialize the javascript functions **(default:false)**.
 * @param {Boolean} [options.ignoreUndefined=true] ignore undefined fields **(default:true)**.
 * @return {Number} returns the number of bytes the BSON object will take up.
 * @api public
 */
function calculateObjectSize(object, options) {
  options = options || {};

  const serializeFunctions =
    typeof options.serializeFunctions === 'boolean' ? options.serializeFunctions : false;
  const ignoreUndefined =
    typeof options.ignoreUndefined === 'boolean' ? options.ignoreUndefined : true;

  return internalCalculateObjectSize(object, serializeFunctions, ignoreUndefined);
}

/**
 * Deserialize stream data as BSON documents.
 *
 * @param {Buffer} data the buffer containing the serialized set of BSON documents.
 * @param {Number} startIndex the start index in the data Buffer where the deserialization is to start.
 * @param {Number} numberOfDocuments number of documents to deserialize.
 * @param {Array} documents an array where to store the deserialized documents.
 * @param {Number} docStartIndex the index in the documents array from where to start inserting documents.
 * @param {Object} [options] additional options used for the deserialization.
 * @param {Object} [options.evalFunctions=false] evaluate functions in the BSON document scoped to the object deserialized.
 * @param {Object} [options.cacheFunctions=false] cache evaluated functions for reuse.
 * @param {Object} [options.cacheFunctionsCrc32=false] use a crc32 code for caching, otherwise use the string of the function.
 * @param {Object} [options.promoteLongs=true] when deserializing a Long will fit it into a Number if it's smaller than 53 bits
 * @param {Object} [options.promoteBuffers=false] when deserializing a Binary will return it as a node.js Buffer instance.
 * @param {Object} [options.promoteValues=false] when deserializing will promote BSON values to their Node.js closest equivalent types.
 * @param {Object} [options.fieldsAsRaw=null] allow to specify if there what fields we wish to return as unserialized raw buffer.
 * @param {Object} [options.bsonRegExp=false] return BSON regular expressions as BSONRegExp instances.
 * @return {Number} returns the next index in the buffer after deserialization **x** numbers of documents.
 * @api public
 */
function deserializeStream(data, startIndex, numberOfDocuments, documents, docStartIndex, options) {
  options = Object.assign({ allowObjectSmallerThanBufferSize: true }, options);
  data = ensureBuffer(data);

  let index = startIndex;
  // Loop over all documents
  for (let i = 0; i < numberOfDocuments; i++) {
    // Find size of the document
    const size =
      data[index] | (data[index + 1] << 8) | (data[index + 2] << 16) | (data[index + 3] << 24);
    // Update options with index
    options.index = index;
    // Parse the document at this point
    documents[docStartIndex + i] = internalDeserialize(data, options);
    // Adjust index by the document size
    index = index + size;
  }

  // Return object containing end index of parsing and list of documents
  return index;
}

/**
 * @ignore
 * @api private
 */
// BSON MAX VALUES
const BSON_INT32_MAX = 0x7fffffff;
const BSON_INT32_MIN = -0x80000000;

const BSON_INT64_MAX = Math.pow(2, 63) - 1;
const BSON_INT64_MIN = -Math.pow(2, 63);

// JS MAX PRECISE VALUES
const JS_INT_MAX = 0x20000000000000; // Any integer up to 2^53 can be precisely represented by a double.
const JS_INT_MIN = -0x20000000000000; // Any integer down to -2^53 can be precisely represented by a double.

/**
 * Number BSON Type
 *
 * @classconstant BSON_DATA_NUMBER
 **/
const BSON_DATA_NUMBER = 1;

/**
 * String BSON Type
 *
 * @classconstant BSON_DATA_STRING
 **/
const BSON_DATA_STRING = 2;

/**
 * Object BSON Type
 *
 * @classconstant BSON_DATA_OBJECT
 **/
const BSON_DATA_OBJECT = 3;

/**
 * Array BSON Type
 *
 * @classconstant BSON_DATA_ARRAY
 **/
const BSON_DATA_ARRAY = 4;

/**
 * Binary BSON Type
 *
 * @classconstant BSON_DATA_BINARY
 **/
const BSON_DATA_BINARY = 5;

/**
 * ObjectID BSON Type
 *
 * @classconstant BSON_DATA_OID
 **/
const BSON_DATA_OID = 7;

/**
 * Boolean BSON Type
 *
 * @classconstant BSON_DATA_BOOLEAN
 **/
const BSON_DATA_BOOLEAN = 8;

/**
 * Date BSON Type
 *
 * @classconstant BSON_DATA_DATE
 **/
const BSON_DATA_DATE = 9;

/**
 * null BSON Type
 *
 * @classconstant BSON_DATA_NULL
 **/
const BSON_DATA_NULL = 10;

/**
 * RegExp BSON Type
 *
 * @classconstant BSON_DATA_REGEXP
 **/
const BSON_DATA_REGEXP = 11;

/**
 * Code BSON Type
 *
 * @classconstant BSON_DATA_CODE
 **/
const BSON_DATA_CODE = 13;

/**
 * Symbol BSON Type
 *
 * @classconstant BSON_DATA_SYMBOL
 **/
const BSON_DATA_SYMBOL = 14;

/**
 * Code with Scope BSON Type
 *
 * @classconstant BSON_DATA_CODE_W_SCOPE
 **/
const BSON_DATA_CODE_W_SCOPE = 15;

/**
 * 32 bit Integer BSON Type
 *
 * @classconstant BSON_DATA_INT
 **/
const BSON_DATA_INT = 16;

/**
 * Timestamp BSON Type
 *
 * @classconstant BSON_DATA_TIMESTAMP
 **/
const BSON_DATA_TIMESTAMP = 17;

/**
 * Long BSON Type
 *
 * @classconstant BSON_DATA_LONG
 **/
const BSON_DATA_LONG = 18;

/**
 * MinKey BSON Type
 *
 * @classconstant BSON_DATA_MIN_KEY
 **/
const BSON_DATA_MIN_KEY = 0xff;

/**
 * MaxKey BSON Type
 *
 * @classconstant BSON_DATA_MAX_KEY
 **/
const BSON_DATA_MAX_KEY = 0x7f;

/**
 * Binary Default Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_DEFAULT
 **/
const BSON_BINARY_SUBTYPE_DEFAULT = 0;

/**
 * Binary Function Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_FUNCTION
 **/
const BSON_BINARY_SUBTYPE_FUNCTION = 1;

/**
 * Binary Byte Array Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_BYTE_ARRAY
 **/
const BSON_BINARY_SUBTYPE_BYTE_ARRAY = 2;

/**
 * Binary UUID Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_UUID
 **/
const BSON_BINARY_SUBTYPE_UUID = 3;

/**
 * Binary MD5 Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_MD5
 **/
const BSON_BINARY_SUBTYPE_MD5 = 4;

/**
 * Binary User Defined Type
 *
 * @classconstant BSON_BINARY_SUBTYPE_USER_DEFINED
 **/
const BSON_BINARY_SUBTYPE_USER_DEFINED = 128;

module.exports = {
  // constants
  BSON_INT32_MAX,
  BSON_INT32_MIN,
  BSON_INT64_MAX,
  BSON_INT64_MIN,
  JS_INT_MAX,
  JS_INT_MIN,
  BSON_DATA_NUMBER,
  BSON_DATA_STRING,
  BSON_DATA_OBJECT,
  BSON_DATA_ARRAY,
  BSON_DATA_BINARY,
  BSON_DATA_OID,
  BSON_DATA_BOOLEAN,
  BSON_DATA_DATE,
  BSON_DATA_NULL,
  BSON_DATA_REGEXP,
  BSON_DATA_CODE,
  BSON_DATA_SYMBOL,
  BSON_DATA_CODE_W_SCOPE,
  BSON_DATA_INT,
  BSON_DATA_TIMESTAMP,
  BSON_DATA_LONG,
  BSON_DATA_MIN_KEY,
  BSON_DATA_MAX_KEY,
  BSON_BINARY_SUBTYPE_DEFAULT,
  BSON_BINARY_SUBTYPE_FUNCTION,
  BSON_BINARY_SUBTYPE_BYTE_ARRAY,
  BSON_BINARY_SUBTYPE_UUID,
  BSON_BINARY_SUBTYPE_MD5,
  BSON_BINARY_SUBTYPE_USER_DEFINED,

  // wrapped types
  Code,
  Map,
  Symbol,
  DBRef,
  Binary,
  ObjectID,
  ObjectId: ObjectID,
  Long,
  Timestamp,
  Double,
  Int32,
  MinKey,
  MaxKey,
  BSONRegExp,
  Decimal128,

  // methods
  serialize,
  serializeWithBufferAndIndex,
  deserialize,
  calculateObjectSize,
  deserializeStream,
  setInternalBufferSize
};
