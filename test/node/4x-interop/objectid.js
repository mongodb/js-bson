'use strict';

var Buffer = require('buffer').Buffer;
var randomBytes = require('./parser/utils').randomBytes;
var deprecate = require('util').deprecate;

// constants
var PROCESS_UNIQUE = randomBytes(5);

// Regular expression that checks for hex value
var checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
var hasBufferType = false;

// Check if buffer exists
try {
  if (Buffer && Buffer.from) hasBufferType = true;
} catch (err) {
  hasBufferType = false;
}

// Precomputed hex table enables speedy hex string conversion
var hexTable = [];
for (var i = 0; i < 256; i++) {
  hexTable[i] = (i <= 15 ? '0' : '') + i.toString(16);
}

// Lookup tables
var decodeLookup = [];
var i = 0;
while (i < 10) decodeLookup[0x30 + i] = i++;
while (i < 16) decodeLookup[0x41 - 10 + i] = decodeLookup[0x61 - 10 + i] = i++;

var _Buffer = Buffer;
function convertToHex(bytes) {
  return bytes.toString('hex');
}

function makeObjectIdError(invalidString, index) {
  var invalidCharacter = invalidString[index];
  return new TypeError(
    'ObjectId string "'+invalidString+'" contains invalid character "'+invalidCharacter+'" with character code ('+invalidString.charCodeAt(index)+'). All character codes for a non-hex string must be less than 256.'
  );
}

/**
 * @ignore
 */
function ObjectId(id) {
  
    // Duck-typing to support ObjectId from different npm packages
    if (id instanceof ObjectId) return id;

    // The most common usecase (blank id, new objectId instance)
    if (id == null || typeof id === 'number') {
      // Generate a new id
      this.id = ObjectId.generate(id);
      // If we are caching the hex string
      if (ObjectId.cacheHexString) this.__id = this.toString('hex');
      // Return the object
      return;
    }

    // Check if the passed in id is valid
    var valid = ObjectId.isValid(id);

    // Throw an error if it's not a valid setup
    if (!valid && id != null) {
      throw new TypeError(
        'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
      );
    } else if (valid && typeof id === 'string' && id.length === 24 && hasBufferType) {
      return new ObjectId(Buffer.from(id, 'hex'));
    } else if (valid && typeof id === 'string' && id.length === 24) {
      return ObjectId.createFromHexString(id);
    } else if (id != null && id.length === 12) {
      // assume 12 byte string
      this.id = id;
    } else if (id != null && id.toHexString) {
      // Duck-typing to support ObjectId from different npm packages
      return id;
    } else {
      throw new TypeError(
        'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
      );
    }

    if (ObjectId.cacheHexString) this.__id = this.toString('hex');
}

  /**
   * @ignore
   */
  ObjectId.prototype.toHexString = function() {
    if (ObjectId.cacheHexString && this.__id) return this.__id;

    var hexString = '';
    if (!this.id || !this.id.length) {
      throw new TypeError(
        'invalid ObjectId, ObjectId.id must be either a string or a Buffer, but is [' +
          JSON.stringify(this.id) +
          ']'
      );
    }

    if (this.id instanceof _Buffer) {
      hexString = convertToHex(this.id);
      if (ObjectId.cacheHexString) this.__id = hexString;
      return hexString;
    }

    for (var i = 0; i < this.id.length; i++) {
      var hexChar = hexTable[this.id.charCodeAt(i)];
      if (typeof hexChar !== 'string') {
        throw makeObjectIdError(this.id, i);
      }
      hexString += hexChar;
    }

    if (ObjectId.cacheHexString) this.__id = hexString;
    return hexString;
  }

  /**
   * @ignore
   */
  ObjectId.prototype.toString = function(format) {
    // Is the id a buffer then use the buffer toString method to return the format
    if (this.id && this.id.copy) {
      return this.id.toString(typeof format === 'string' ? format : 'hex');
    }

    return this.toHexString();
  }

  /**
   * @ignore
   */
  ObjectId.prototype.toJSON = function() {
    return this.toHexString();
  }

  /**
   * @ignore
   */
  ObjectId.prototype.equals = function(otherId) {
    if (otherId instanceof ObjectId) {
      return this.toString() === otherId.toString();
    }

    if (
      typeof otherId === 'string' &&
      ObjectId.isValid(otherId) &&
      otherId.length === 12 &&
      this.id instanceof _Buffer
    ) {
      return otherId === this.id.toString('binary');
    }

    if (typeof otherId === 'string' && ObjectId.isValid(otherId) && otherId.length === 24) {
      return otherId.toLowerCase() === this.toHexString();
    }

    if (typeof otherId === 'string' && ObjectId.isValid(otherId) && otherId.length === 12) {
      return otherId === this.id;
    }

    if (otherId != null && (otherId instanceof ObjectId || otherId.toHexString)) {
      return otherId.toHexString() === this.toHexString();
    }

    return false;
  }

  /**
   * @ignore
   */
  ObjectId.prototype.getTimestamp = function() {
    var timestamp = new Date();
    var time = this.id[3] | (this.id[2] << 8) | (this.id[1] << 16) | (this.id[0] << 24);
    timestamp.setTime(Math.floor(time) * 1000);
    return timestamp;
  }

  /**
   * @ignore
   */
  ObjectId.prototype.toExtendedJSON = function() {
    if (this.toHexString) return { $oid: this.toHexString() };
    return { $oid: this.toString('hex') };
  }

  ObjectId.prototype.constructor = ObjectId;

  /**
   * @ignore
   */
  ObjectId.createPk = function() {
    return new ObjectId();
  }

  /**
   * @ignore
   */
  ObjectId.createFromTime = function(time) {
    var buffer = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    // Encode time into first 4 bytes
    buffer[3] = time & 0xff;
    buffer[2] = (time >> 8) & 0xff;
    buffer[1] = (time >> 16) & 0xff;
    buffer[0] = (time >> 24) & 0xff;
    // Return the new objectId
    return new ObjectId(buffer);
  }

  /**
   * @ignore
   */
  ObjectId.createFromHexString = function(string) {
    // Throw an error if it's not a valid setup
    if (typeof string === 'undefined' || (string != null && string.length !== 24)) {
      throw new TypeError(
        'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
      );
    }

    // Use Buffer.from method if available
    if (hasBufferType) return new ObjectId(Buffer.from(string, 'hex'));

    // Calculate lengths
    var array = new _Buffer(12);

    var n = 0;
    var i = 0;
    while (i < 24) {
      array[n++] =
        (decodeLookup[string.charCodeAt(i++)] << 4) | decodeLookup[string.charCodeAt(i++)];
    }

    return new ObjectId(array);
  }

  /**
   * @ignore
   */
  ObjectId.isValid = function(id) {
    if (id == null) return false;

    if (typeof id === 'number') {
      return true;
    }

    if (typeof id === 'string') {
      return id.length === 12 || (id.length === 24 && checkForHexRegExp.test(id));
    }

    if (id instanceof ObjectId) {
      return true;
    }

    if (id instanceof _Buffer && id.length === 12) {
      return true;
    }

    // Duck-Typing detection of ObjectId like objects
    if (id.toHexString) {
      return id.id.length === 12 || (id.id.length === 24 && checkForHexRegExp.test(id.id));
    }

    return false;
  }

  /**
   * @ignore
   */
  ObjectId.getInc = function() {
    return (ObjectId.index = (ObjectId.index + 1) % 0xffffff);
  }

  /**
   * @ignore
   */
  ObjectId.generate = function(time) {
    if ('number' !== typeof time) {
      time = ~~(Date.now() / 1000);
    }

    var inc = ObjectId.getInc();
    var buffer = Buffer.alloc ? Buffer.alloc(12) : new Buffer(12);

    // 4-byte timestamp
    buffer[3] = time & 0xff;
    buffer[2] = (time >> 8) & 0xff;
    buffer[1] = (time >> 16) & 0xff;
    buffer[0] = (time >> 24) & 0xff;

    // 5-byte process unique
    buffer[4] = PROCESS_UNIQUE[0];
    buffer[5] = PROCESS_UNIQUE[1];
    buffer[6] = PROCESS_UNIQUE[2];
    buffer[7] = PROCESS_UNIQUE[3];
    buffer[8] = PROCESS_UNIQUE[4];

    // 3-byte counter
    buffer[11] = inc & 0xff;
    buffer[10] = (inc >> 8) & 0xff;
    buffer[9] = (inc >> 16) & 0xff;

    return buffer;
  }

  /**
   * @ignore
   */
  ObjectId.fromExtendedJSON = function(doc) {
    return new ObjectId(doc.$oid);
  }



// Deprecated methods
ObjectId.get_inc = deprecate(
  function() {return ObjectId.getInc()},
  'Please use the static `ObjectId.getInc()` instead'
);

ObjectId.prototype.getInc = deprecate(
  function() {return ObjectId.getInc()},
  'Please use the static `ObjectId.getInc()` instead'
);

ObjectId.prototype.generate = deprecate(
  function(time) {return ObjectId.generate(time)},
  'Please use the static `ObjectId.generate(time)` instead'
);

Object.defineProperty(ObjectId.prototype, 'generationTime', {
  enumerable: true,
  get: function() {
    return this.id[3] | (this.id[2] << 8) | (this.id[1] << 16) | (this.id[0] << 24);
  },
  set: function(value) {
    // Encode time into first 4 bytes
    this.id[3] = value & 0xff;
    this.id[2] = (value >> 8) & 0xff;
    this.id[1] = (value >> 16) & 0xff;
    this.id[0] = (value >> 24) & 0xff;
  }
});

/**
 * Converts to a string representation of this Id.
 *
 * @return {String} return the 24 byte hex string representation.
 * @ignore
 */
ObjectId.prototype.inspect = ObjectId.prototype.toString;

/**
 * @ignore
 */
ObjectId.index = ~~(Math.random() * 0xffffff);

Object.defineProperty(ObjectId.prototype, '_bsontype', { value: 'ObjectId' });
module.exports = ObjectId;
