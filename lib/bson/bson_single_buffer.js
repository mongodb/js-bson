var writeIEEE754 = require('./float_parser').writeIEEE754
	, Long = require('./long').Long
  , Double = require('./double').Double
  , Timestamp = require('./timestamp').Timestamp
  , ObjectID = require('./objectid').ObjectID
  , Symbol = require('./symbol').Symbol
  , Code = require('./code').Code
  , MinKey = require('./min_key').MinKey
  , MaxKey = require('./max_key').MaxKey
  , DBRef = require('./db_ref').DBRef
  , Binary = require('./binary').Binary
  , BinaryParser = require('./binary_parser').BinaryParser;

/**
 * @ignore
 * @api private
 */
// Max Document Buffer size
var buffer = new Buffer(1024 * 1024 * 16);

var checkKey = function checkKey (key, dollarsAndDotsOk) {
  if (!key.length) return;
  // Check if we have a legal key for the object
  if (!!~key.indexOf("\x00")) {
    // The BSON spec doesn't allow keys with null bytes because keys are
    // null-terminated.
    throw Error("key " + key + " must not contain null bytes");
  }
  if (!dollarsAndDotsOk) {
    if('$' == key[0]) {
      throw Error("key " + key + " must not start with '$'");
    } else if (!!~key.indexOf('.')) {
      throw Error("key " + key + " must not contain '.'");
    }
  }
};

var serializeString = function(key, value, index) {
  // Encode String type
  buffer[index++] = BSON.BSON_DATA_STRING;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes + 1;
  buffer[index - 1] = 0;

  // Calculate size
  var size = Buffer.byteLength(value) + 1;
  // Write the size of the string to buffer
  buffer[index + 3] = (size >> 24) & 0xff;
  buffer[index + 2] = (size >> 16) & 0xff;
  buffer[index + 1] = (size >> 8) & 0xff;
  buffer[index] = size & 0xff;
  // Ajust the index
  index = index + 4;
  // Write the string
  buffer.write(value, index, 'utf8');
  // Update index
  index = index + size - 1;
  // Write zero
  buffer[index++] = 0;
  return index;
}

var serializeNumber = function(key, value, index) {
  // We have an integer value
  if(Math.floor(value) === value && value >= BSON.JS_INT_MIN && value <= BSON.JS_INT_MAX) {
    // If the value fits in 32 bits encode as int, if it fits in a double
    // encode it as a double, otherwise long
    if(value >= BSON.BSON_INT32_MIN && value <= BSON.BSON_INT32_MAX) {
      // Set int type 32 bits or less
      buffer[index++] = BSON.BSON_DATA_INT;
      // Number of written bytes
      var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
      // Encode the name
      index = index + numberOfWrittenBytes;
      buffer[index++] = 0;
      // Write the int value
      buffer[index++] = value & 0xff;
      buffer[index++] = (value >> 8) & 0xff;
      buffer[index++] = (value >> 16) & 0xff;
      buffer[index++] = (value >> 24) & 0xff;
    } else if(value >= BSON.JS_INT_MIN && value <= BSON.JS_INT_MAX) {
      // Encode as double
      buffer[index++] = BSON.BSON_DATA_NUMBER;
      // Number of written bytes
      var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
      // Encode the name
      index = index + numberOfWrittenBytes;
      buffer[index++] = 0;
      // Write float
      writeIEEE754(buffer, value, index, 'little', 52, 8);
      // Ajust index
      index = index + 8;
    } else {
      // Set long type
      buffer[index++] = BSON.BSON_DATA_LONG;
      // Number of written bytes
      var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
      // Encode the name
      index = index + numberOfWrittenBytes;
      buffer[index++] = 0;
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
    var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
    // Encode the name
    index = index + numberOfWrittenBytes;
    buffer[index++] = 0;
    // Write float
    writeIEEE754(buffer, value, index, 'little', 52, 8);
    // Ajust index
    index = index + 8;
  }

	return index;
}

var serializeUndefined = function(key, value, index) {
  // Set long type
  buffer[index++] = BSON.BSON_DATA_NULL;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
	return index;
}

var serializeBoolean = function(key, value, index) {
  // Write the type
  buffer[index++] = BSON.BSON_DATA_BOOLEAN;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Encode the boolean value
  buffer[index++] = value ? 1 : 0;
	return index;
}

var serializeDate = function(key, value, index) {
  // Write the type
  buffer[index++] = BSON.BSON_DATA_DATE;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;

  // Write the date
  var dateInMilis = Long.fromNumber(value.getTime());
  var lowBits = dateInMilis.getLowBits();
  var highBits = dateInMilis.getHighBits();
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
}

var serializeRegExp = function(key, value, index) {
  // Write the type
  buffer[index++] = BSON.BSON_DATA_REGEXP;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;

  // Write the regular expression string
  buffer.write(value.source, index, 'utf8');
  // Adjust the index
  index = index + Buffer.byteLength(value.source);
  // Write zero
  buffer[index++] = 0x00;
  // Write the parameters
  if(value.global) buffer[index++] = 0x73; // s
  if(value.ignoreCase) buffer[index++] = 0x69; // i
  if(value.multiline) buffer[index++] = 0x6d; // m
  // Add ending zero
  buffer[index++] = 0x00;
	return index;
}

var serializeMinMax = function(key, value, index) {
  // Write the type of either min or max key
  if(value === null) {
    buffer[index++] = BSON.BSON_DATA_NULL;
  } else if(value instanceof MinKey) {
    buffer[index++] = BSON.BSON_DATA_MIN_KEY;
  } else {
    buffer[index++] = BSON.BSON_DATA_MAX_KEY;
  }

  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  return index;
}

var serializeObjectId = function(key, value, index) {
  // Write the type
  buffer[index++] = BSON.BSON_DATA_OID;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;

  for(var j = 0; j < 12; j++) {
  	buffer[index + j] = value.binId[j];
  }

  // Ajust index
  index = index + 12;
	return index;
}

var serializeBuffer = function(key, value, index) {
  // Write the type
  buffer[index++] = BSON.BSON_DATA_BINARY;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Get size of the buffer (current write point)
  var size = value.length;
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
}

var serializeObject = function(key, value, index, checkKeys, depth) {
  // Write the type
  buffer[index++] = Array.isArray(value) ? BSON.BSON_DATA_ARRAY : BSON.BSON_DATA_OBJECT;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  var endIndex = serializeInto(value, checkKeys, index, depth + 1);
  // Write size
  var size = endIndex - index;
  return endIndex;
}

var serializeLong = function(key, value, index) {
  // Write the type
  buffer[index++] = value instanceof Long ? BSON.BSON_DATA_LONG : BSON.BSON_DATA_TIMESTAMP;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Write the date
  var lowBits = value.getLowBits();
  var highBits = value.getHighBits();
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
}

var serializeDouble = function(key, value, index) {
  // Encode as double
  buffer[index++] = BSON.BSON_DATA_NUMBER;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Write float
  writeIEEE754(buffer, value, index, 'little', 52, 8);
  // Ajust index
  index = index + 8;
	return index;
}

var serializeCode = function(key, value, index, checkKeys, depth) {
  if(value.scope != null && Object.keys(value.scope).length > 0) {
    // Write the type
    buffer[index++] = BSON.BSON_DATA_CODE_W_SCOPE;
    // Number of written bytes
    var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
    // Encode the name
    index = index + numberOfWrittenBytes;
    buffer[index++] = 0;

    // Starting index
    var startIndex = index;

    // Serialize the function
    // Get the function string
    var functionString = typeof value.code == 'string' ? value.code : value.code.toString();
    var codeSize = Buffer.byteLength(functionString) + 1;
    // Index adjustment
    index = index + 4;
    // Write the size of the string to buffer
    buffer[index] = codeSize & 0xff;
    buffer[index + 1] = (codeSize >> 8) & 0xff;
    buffer[index + 2] = (codeSize >> 16) & 0xff;
    buffer[index + 3] = (codeSize >> 24) & 0xff;
    // Write string into buffer
    buffer.write(functionString, index + 4, 'utf8');
    // Write end 0
    buffer[index + 4 + codeSize - 1] = 0;
    // Write the
    index = index + codeSize + 4;

    //
    // Serialize the scope value
    var endIndex = serializeInto(value.scope, checkKeys, index, depth + 1)
    index = endIndex - 1;

    // Writ the total
    var totalSize = endIndex - startIndex;

    // Write the total size of the object
    buffer[startIndex++] = totalSize & 0xff;
    buffer[startIndex++] = (totalSize >> 8) & 0xff;
    buffer[startIndex++] = (totalSize >> 16) & 0xff;
    buffer[startIndex++] = (totalSize >> 24) & 0xff;
    // Write trailing zero
    buffer[index++] = 0;
  } else {
    buffer[index++] = BSON.BSON_DATA_CODE;
    // Number of written bytes
    var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
    // Encode the name
    index = index + numberOfWrittenBytes;
    buffer[index++] = 0;
    // Function string
    var functionString = value.code.toString();
    // Function Size
    var size = Buffer.byteLength(functionString) + 1;
    // Write the size of the string to buffer
    buffer[index++] = size & 0xff;
    buffer[index++] = (size >> 8) & 0xff;
    buffer[index++] = (size >> 16) & 0xff;
    buffer[index++] = (size >> 24) & 0xff;
    // Write the string
    buffer.write(functionString, index, 'utf8');
    // Update index
    index = index + size - 1;
    // Write zero
    buffer[index++] = 0;
  }

	return index;
}

var serializeBinary = function(key, value, index) {
  // Write the type
  buffer[index++] = BSON.BSON_DATA_BINARY;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Extract the buffer
  var data = value.value(true);
  // Calculate size
  var size = value.position;
  // Write the size of the string to buffer
  buffer[index++] = size & 0xff;
  buffer[index++] = (size >> 8) & 0xff;
  buffer[index++] = (size >> 16) & 0xff;
  buffer[index++] = (size >> 24) & 0xff;
  // Write the subtype to the buffer
  buffer[index++] = value.sub_type;

  // If we have binary type 2 the 4 first bytes are the size
  if(value.sub_type == Binary.SUBTYPE_BYTE_ARRAY) {
    buffer[index++] = size & 0xff;
    buffer[index++] = (size >> 8) & 0xff;
    buffer[index++] = (size >> 16) & 0xff;
    buffer[index++] = (size >> 24) & 0xff;
  }

  // Write the data to the object
  data.copy(buffer, index, 0, value.position);
  // Adjust the index
  index = index + value.position;
	return index;
}

var serializeSymbol = function(key, value, index) {
  // Write the type
  buffer[index++] = BSON.BSON_DATA_SYMBOL;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');
  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;
  // Calculate size
  var size = Buffer.byteLength(value.value) + 1;
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
}

var serializeDBRef = function(key, value, index, depth) {
  // Write the type
  buffer[index++] = BSON.BSON_DATA_OBJECT;
  // Number of written bytes
  var numberOfWrittenBytes = buffer.write(key, index, 'utf8');

  // Encode the name
  index = index + numberOfWrittenBytes;
  buffer[index++] = 0;

  var startIndex = index;
  var endIndex;

  // Serialize object
  if(null != value.db) {
  	endIndex = serializeInto({
        '$ref': value.namespace
      , '$id' : value.oid
      , '$db' : value.db
    }, false, index, depth + 1);
  } else {
  	endIndex = serializeInto({
        '$ref': value.namespace
      , '$id' : value.oid
    }, false, index, depth + 1);
  }

  // Calculate object size
  var size = endIndex - startIndex;
  // Write the size
  buffer[startIndex++] = size & 0xff;
  buffer[startIndex++] = (size >> 8) & 0xff;
  buffer[startIndex++] = (size >> 16) & 0xff;
  buffer[startIndex++] = (size >> 24) & 0xff;
  // Set index
  return endIndex;
}

var BSON = function() {
	this.buffer = buffer;
}

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
BSON.prototype.serialize = function serialize(object, checkKeys, index) {
	var finishedBuffer = new Buffer(serializeInto(object, checkKeys, index || 0, 0));
	this.buffer.copy(finishedBuffer, 0, 0, finishedBuffer.length);
	return finishedBuffer;
}

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
BSON.prototype.deserialize = function(data, options) {
  return deserialize(data, options);
}

var serializeInto = function serializeInto(object, checkKeys, startingIndex, depth) {
	startingIndex = startingIndex || 0;

	// Start place to serialize into
	var index = startingIndex + 4;
	var self = this;

	// Special case isArray
	if(Array.isArray(object)) {
		// Get object keys
		for(var i = 0; i < object.length; i++) {
			var key = "" + i;
			var type = typeof object[i];

	    // Check the key and throw error if it's illegal
	    if(key != '$db' && key != '$ref' && key != '$id') {
	      checkKey(key, !checkKeys);
	    }

			if(type == 'string') {
				index = serializeString(key, object[i], index);
			} else if(type == 'number') {
				index = serializeNumber(key, object[i], index);
	    } else if(type == 'undefined') {
	    	index = serializeUndefined(key, object[i], index);
	    } else if(type == 'boolean') {
	    	index = serializeBoolean(key, object[i], index);
	    } else if(object[i] instanceof Date) {
	    	index = serializeDate(key, object[i], index);
	    } else if(object[i] instanceof RegExp || Object.prototype.toString.call(object[i]) === '[object RegExp]') {
	    	index = serializeRegExp(key, object[i], index);
	    } else if(object[i]['_bsontype'] == 'MinKey' || object[i]['_bsontype'] == 'MaxKey') {
	    	index = serializeMinMax(key, object[i], index);
	    } else if(object[i]['_bsontype'] == 'ObjectID') {
	    	index = serializeObjectId(key, object[i], index);
	    } else if(Buffer.isBuffer(object[i])) {
	    	index = serializeBuffer(key, object[i], index);
			} else if(type == 'object' && object[i]['_bsontype'] == null) {
				index = serializeObject(key, object[i], index, checkKeys, depth);
	    } else if(object[i]['_bsontype'] == 'Long' || object[i]['_bsontype'] == 'Timestamp') {
	    	index = serializeLong(key, object[i], index);
	    } else if(object[i]['_bsontype'] == 'Double') {
	    	index = serializeDouble(key, object[i], index);
	    } else if(object[i]['_bsontype'] == 'Code') {
	    	index = serializeCode(key, object[i], index, checkKeys, depth);
	    } else if(object[i]['_bsontype'] == 'Binary') {
	    	index = serializeBinary(key, object[i], index);
	    } else if(object[i]['_bsontype'] == 'Symbol') {
	    	index = serializeSymbol(key, object[i], index);
	    } else if(object[i]['_bsontype'] == 'DBRef') {
	    	index = serializeDBRef(key, object[i], index, depth);
	    }
	  }
	} else {
		var keys = Object.keys(object);
		for(var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var type = typeof object[key];

	    // Check the key and throw error if it's illegal
	    if(key != '$db' && key != '$ref' && key != '$id') {
	      checkKey(key, !checkKeys);
	    }

			if(type == 'string') {
				index = serializeString(key, object[key], index);
			} else if(type == 'number') {
				index = serializeNumber(key, object[key], index);
	    } else if(type == 'undefined') {
	    	index = serializeUndefined(key, object[key], index);
	    } else if(type == 'boolean') {
	    	index = serializeBoolean(key, object[key], index);
	    } else if(object[key] instanceof Date) {
	    	index = serializeDate(key, object[key], index);
	    } else if(object[key] instanceof RegExp || Object.prototype.toString.call(object[key]) === '[object RegExp]') {
	    	index = serializeRegExp(key, object[key], index);
	    } else if(object[key]['_bsontype'] == 'MinKey' || object[key]['_bsontype'] == 'MaxKey') {
	    	index = serializeMinMax(key, object[key], index);
	    } else if(object[key]['_bsontype'] == 'ObjectID') {
	    	index = serializeObjectId(key, object[key], index);
	    } else if(Buffer.isBuffer(object[key])) {
	    	index = serializeBuffer(key, object[key], index);
			} else if(type == 'object' && object[key]['_bsontype'] == null) {
				index = serializeObject(key, object[key], index, checkKeys, depth);
	    } else if(object[key]['_bsontype'] == 'Long' || object[key]['_bsontype'] == 'Timestamp') {
	    	index = serializeLong(key, object[key], index);
	    } else if(object[key]['_bsontype'] == 'Double') {
	    	index = serializeDouble(key, object[key], index);
	    } else if(object[key]['_bsontype'] == 'Code') {
	    	index = serializeCode(key, object[key], index, checkKeys, depth);
	    } else if(object[key]['_bsontype'] == 'Binary') {
	    	index = serializeBinary(key, object[key], index);
	    } else if(object[key]['_bsontype'] == 'Symbol') {
	    	index = serializeSymbol(key, object[key], index);
	    } else if(object[key]['_bsontype'] == 'DBRef') {
	    	index = serializeDBRef(key, object[key], index, depth);
	    }
		}
	}

	// Final padding byte for object
	buffer[index++] = 0x00;

	// Final size
	var size = index - startingIndex;
  // Write the size of the object
  buffer[startingIndex++] = size & 0xff;
  buffer[startingIndex++] = (size >> 8) & 0xff;
  buffer[startingIndex++] = (size >> 16) & 0xff;
  buffer[startingIndex++] = (size >> 24) & 0xff;
  return index;
}

var deserialize = function(buffer, options, isArray) {
  // Options
  options = options == null ? {} : options;
  var evalFunctions = options['evalFunctions'] == null ? false : options['evalFunctions'];
  var cacheFunctions = options['cacheFunctions'] == null ? false : options['cacheFunctions'];
  var cacheFunctionsCrc32 = options['cacheFunctionsCrc32'] == null ? false : options['cacheFunctionsCrc32'];
  var promoteLongs = options['promoteLongs'] == null ? true : options['promoteLongs'];

  // Validate that we have at least 4 bytes of buffer
  if(buffer.length < 5) throw new Error("corrupt bson message < 5 bytes long");

  // Set up index
  var index = typeof options['index'] == 'number' ? options['index'] : 0;
  // Reads in a C style string
  var readCStyleString = function() {
    // Get the start search index
    var i = index;
    // Locate the end of the c string
    while(buffer[i] !== 0x00 && i < buffer.length) {
      i++
    }
    // If are at the end of the buffer there is a problem with the document
    if(i >= buffer.length) throw new Error("Bad BSON Document: illegal CString")
    // Grab utf8 encoded string
    var string = buffer.toString('utf8', index, i);
    // Update index position
    index = i + 1;
    // Return string
    return string;
  }

  // Create holding object
  var object = isArray ? [] : {};

  // Read the document size
  var size = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;

  // Ensure buffer is valid size
  if(size < 5 || size > buffer.length) throw new Error("corrupt bson message");

  // While we have more left data left keep parsing
  while(true) {
    // Read the type
    var elementType = buffer[index++];
    // If we get a zero it's the last byte, exit
    if(elementType == 0) break;
    // Read the name of the field
    var name = readCStyleString();
    // Switch on the type
		if(elementType == BSON.BSON_DATA_OID) {
      var string = buffer.toString('binary', index, index + 12);
      // Decode the oid
      object[name] = new ObjectID(string);
      // Update index
      index = index + 12;
		} else if(elementType == BSON.BSON_DATA_STRING) {
      // Read the content of the field
      var stringSize = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
      // Add string to object
      object[name] = buffer.toString('utf8', index, index + stringSize - 1);
      // Update parse index position
      index = index + stringSize;
		} else if(elementType == BSON.BSON_DATA_INT) {
      // Decode the 32bit value
      object[name] = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
		} else if(elementType == BSON.BSON_DATA_NUMBER) {
      // Decode the double value
      object[name] = readIEEE754(buffer, index, 'little', 52, 8);
      // Update the index
      index = index + 8;
		} else if(elementType == BSON.BSON_DATA_DATE) {
      // Unpack the low and high bits
      var lowBits = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
      var highBits = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
      // Set date object
      object[name] = new Date(new Long(lowBits, highBits).toNumber());
		} else if(elementType == BSON.BSON_DATA_BOOLEAN) {
      // Parse the boolean value
      object[name] = buffer[index++] == 1;
		} else if(elementType == BSON.BSON_DATA_UNDEFINED || elementType == BSON.BSON_DATA_NULL) {
      // Parse the boolean value
      object[name] = null;
		} else if(elementType == BSON.BSON_DATA_BINARY) {
      // Decode the size of the binary blob
      var binarySize = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
      // Decode the subtype
      var subType = buffer[index++];
      // Decode as raw Buffer object if options specifies it
      if(buffer['slice'] != null) {
        // If we have subtype 2 skip the 4 bytes for the size
        if(subType == Binary.SUBTYPE_BYTE_ARRAY) {
          binarySize = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
        }
        // Slice the data
        object[name] = new Binary(buffer.slice(index, index + binarySize), subType);
      } else {
        var _buffer = typeof Uint8Array != 'undefined' ? new Uint8Array(new ArrayBuffer(binarySize)) : new Array(binarySize);
        // If we have subtype 2 skip the 4 bytes for the size
        if(subType == Binary.SUBTYPE_BYTE_ARRAY) {
          binarySize = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
        }
        // Copy the data
        for(var i = 0; i < binarySize; i++) {
          _buffer[i] = buffer[index + i];
        }
        // Create the binary object
        object[name] = new Binary(_buffer, subType);
      }
      // Update the index
      index = index + binarySize;
		} else if(elementType == BSON.BSON_DATA_ARRAY) {
      options['index'] = index;
      // Decode the size of the array document
      var objectSize = buffer[index] | buffer[index + 1] << 8 | buffer[index + 2] << 16 | buffer[index + 3] << 24;
      // Set the array to the object
      object[name] = deserialize.deserialize(buffer, options, true);
      // Adjust the index
      index = index + objectSize;
		} else if(elementType == BSON.BSON_DATA_OBJECT) {
      options['index'] = index;
      // Decode the size of the object document
      var objectSize = buffer[index] | buffer[index + 1] << 8 | buffer[index + 2] << 16 | buffer[index + 3] << 24;
      // Set the array to the object
      object[name] = deserialize(buffer, options, false);
      // Adjust the index
      index = index + objectSize;
		} else if(elementType == BSON.BSON_DATA_REGEXP) {
      // Create the regexp
      var source = readCStyleString();
      var regExpOptions = readCStyleString();
      // For each option add the corresponding one for javascript
      var optionsArray = new Array(regExpOptions.length);

      // Parse options
      for(var i = 0; i < regExpOptions.length; i++) {
        switch(regExpOptions[i]) {
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
		} else if(elementType == BSON.BSON_DATA_LONG) {
      // Unpack the low and high bits
      var lowBits = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
      var highBits = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
      // Create long object
      var long = new Long(lowBits, highBits);
      // Promote the long if possible
      if(promoteLongs) {
        object[name] = long.lessThanOrEqual(JS_INT_MAX_LONG) && long.greaterThanOrEqual(JS_INT_MIN_LONG) ? long.toNumber() : long;
      } else {
        object[name] = long;
      }
		} else if(elementType == BSON.BSON_DATA_SYMBOL) {
      // Read the content of the field
      var stringSize = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
      // Add string to object
      object[name] = new Symbol(buffer.toString('utf8', index, index + stringSize - 1));
      // Update parse index position
      index = index + stringSize;
		} else if(elementType == BSON.BSON_DATA_TIMESTAMP) {
      // Unpack the low and high bits
      var lowBits = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
      var highBits = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
      // Set the object
      object[name] = new Timestamp(lowBits, highBits);
		} else if(elementType == BSON.BSON_DATA_MIN_KEY) {
      // Parse the object
      object[name] = new MinKey();
		} else if(elementType == BSON.BSON_DATA_MAX_KEY) {
      // Parse the object
      object[name] = new MaxKey();
		} else if(elementType == BSON.BSON_DATA_CODE) {
      // Read the content of the field
      var stringSize = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
      // Function string
      var functionString = buffer.toString('utf8', index, index + stringSize - 1);

      // If we are evaluating the functions
      if(evalFunctions) {
        // Contains the value we are going to set
        var value = null;
        // If we have cache enabled let's look for the md5 of the function in the cache
        if(cacheFunctions) {
          var hash = cacheFunctionsCrc32 ? crc32(functionString) : functionString;
          // Got to do this to avoid V8 deoptimizing the call due to finding eval
          object[name] = isolateEvalWithHash(functionCache, hash, functionString, object);
        } else {
          // Set directly
          object[name] = isolateEval(functionString);
        }
      } else {
        object[name]  = new Code(functionString, {});
      }

      // Update parse index position
      index = index + stringSize;
		} else if(elementType == BSON.BSON_DATA_CODE_W_SCOPE) {
      // Read the content of the field
      var totalSize = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
      var stringSize = buffer[index++] | buffer[index++] << 8 | buffer[index++] << 16 | buffer[index++] << 24;
      // Javascript function
      var functionString = buffer.toString('utf8', index, index + stringSize - 1);
      // Update parse index position
      index = index + stringSize;
      // Parse the element
      options['index'] = index;
      // Decode the size of the object document
      var objectSize = buffer[index] | buffer[index + 1] << 8 | buffer[index + 2] << 16 | buffer[index + 3] << 24;
      // Decode the scope object
      var scopeObject = deserialize(buffer, options, false);
      // Adjust the index
      index = index + objectSize;

      // If we are evaluating the functions
      if(evalFunctions) {
        // Contains the value we are going to set
        var value = null;
        // If we have cache enabled let's look for the md5 of the function in the cache
        if(cacheFunctions) {
          var hash = cacheFunctionsCrc32 ? crc32(functionString) : functionString;
          // Got to do this to avoid V8 deoptimizing the call due to finding eval
          object[name] = isolateEvalWithHash(functionCache, hash, functionString, object);
        } else {
          // Set directly
          object[name] = isolateEval(functionString);
        }

        // Set the scope on the object
        object[name].scope = scopeObject;
      } else {
        object[name]  = new Code(functionString, scopeObject);
      }
    }
  }

  // Check if we have a db ref object
  if(object['$id'] != null) object = new DBRef(object['$ref'], object['$id'], object['$db']);

  // Return the final objects
  return object;
}

/**
 * @ignore
 * @api private
 */
// BSON MAX VALUES
BSON.BSON_INT32_MAX = 0x7FFFFFFF;
BSON.BSON_INT32_MIN = -0x80000000;

BSON.BSON_INT64_MAX = Math.pow(2, 63) - 1;
BSON.BSON_INT64_MIN = -Math.pow(2, 63);

// JS MAX PRECISE VALUES
BSON.JS_INT_MAX = 0x20000000000000;  // Any integer up to 2^53 can be precisely represented by a double.
BSON.JS_INT_MIN = -0x20000000000000;  // Any integer down to -2^53 can be precisely represented by a double.

// Internal long versions
var JS_INT_MAX_LONG = Long.fromNumber(0x20000000000000);  // Any integer up to 2^53 can be precisely represented by a double.
var JS_INT_MIN_LONG = Long.fromNumber(-0x20000000000000);  // Any integer down to -2^53 can be precisely represented by a double.

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

// Return BSON
exports.BSON = BSON;
