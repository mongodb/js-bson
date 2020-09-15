import { Buffer } from 'buffer';
import { deprecate, inspect } from 'util';
import { haveBuffer, randomBytes } from './parser/utils';

// constants
const PROCESS_UNIQUE = randomBytes(5);

// Regular expression that checks for hex value
const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');

// Precomputed hex table enables speedy hex string conversion
const hexTable: string[] = [];
for (let i = 0; i < 256; i++) {
  hexTable[i] = (i <= 15 ? '0' : '') + i.toString(16);
}

// Lookup tables
const decodeLookup: number[] = [];
let i = 0;
while (i < 10) decodeLookup[0x30 + i] = i++;
while (i < 16) decodeLookup[0x41 - 10 + i] = decodeLookup[0x61 - 10 + i] = i++;

function convertToHex(bytes: Buffer): string {
  return bytes.toString('hex');
}

function makeObjectIdError(invalidString: string, index: number) {
  const invalidCharacter = invalidString[index];
  return new TypeError(
    `ObjectId string "${invalidString}" contains invalid character "${invalidCharacter}" with character code (${invalidString.charCodeAt(
      index
    )}). All character codes for a non-hex string must be less than 256.`
  );
}

export interface ObjectIdLike {
  id: string | Buffer;
  toHexString(): string;
}

/**
 * A class representation of the BSON ObjectId type.
 */
export class ObjectId {
  _bsontype!: 'ObjectId';

  /** @internal */
  static index = ~~(Math.random() * 0xffffff);

  static cacheHexString?: boolean;
  id: string | Buffer;
  __id?: string;

  /**
   * Create an ObjectId type
   *
   * @param id - Can be a 24 character hex string, 12 byte binary Buffer, or a number.
   */
  constructor(id?: string | Buffer | number | ObjectIdLike | ObjectId) {
    // Duck-typing to support ObjectId from different npm packages
    if (id instanceof ObjectId) {
      this.id = id.id;
      this.__id = id.__id;
      return;
    }

    // The most common use case (blank id, new objectId instance)
    if (id == null || typeof id === 'number') {
      // Generate a new id
      this.id = ObjectId.generate(typeof id === 'number' ? id : undefined);
      // If we are caching the hex string
      if (ObjectId.cacheHexString) this.__id = this.toString('hex');
      // Return the object
      return;
    }

    // Check if the passed in id is valid
    const valid = ObjectId.isValid(id);

    // Throw an error if it's not a valid setup
    if (!valid) {
      throw new TypeError(
        'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
      );
    } else if (valid && typeof id === 'string' && id.length === 24 && haveBuffer()) {
      this.id = Buffer.from(id, 'hex');
    } else if (valid && typeof id === 'string' && id.length === 24) {
      this.id = ObjectId.createFromHexString(id).id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if ((id as any)['length'] === 12) {
      // assume 12 byte string
      this.id = id as string | Buffer;
    } else if (
      typeof id !== 'string' &&
      'toHexString' in id &&
      typeof id.toHexString === 'function'
    ) {
      // Duck-typing to support ObjectId from different npm packages
      this.id = ObjectId.createFromHexString(id.toHexString()).id;
    } else {
      throw new TypeError(
        'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
      );
    }

    if (ObjectId.cacheHexString) this.__id = this.toString('hex');
  }

  /**
   * The generation time of this ObjectId instance
   * @deprecated Please use getTimestamp / createFromTime which returns a Date
   */
  get generationTime(): number {
    if (typeof this.id === 'string') {
      return (
        this.id.charCodeAt(3) |
        (this.id.charCodeAt(2) << 8) |
        (this.id.charCodeAt(1) << 16) |
        (this.id.charCodeAt(0) << 24)
      );
    }
    return this.id[3] | (this.id[2] << 8) | (this.id[1] << 16) | (this.id[0] << 24);
  }

  /**
   * Sets the generation time of this ObjectId instance
   * @deprecated Please use createFromTime
   */
  set generationTime(value: number) {
    // Encode time into first 4 bytes
    const bytes = [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff];
    if (typeof this.id === 'string') {
      let result = '';
      for (const byte of bytes) {
        result += String.fromCharCode(byte);
      }
      result += this.id.slice(4);
      this.id = result;
      return;
    }
    this.id[3] = value & 0xff;
    this.id[2] = (value >> 8) & 0xff;
    this.id[1] = (value >> 16) & 0xff;
    this.id[0] = (value >> 24) & 0xff;
  }

  /** Returns the ObjectId id as a 24 character hex string representation */
  toHexString(): string {
    if (ObjectId.cacheHexString && this.__id) return this.__id;

    let hexString = '';
    if (!this.id || !this.id.length) {
      throw new TypeError(
        'invalid ObjectId, ObjectId.id must be either a string or a Buffer, but is [' +
          JSON.stringify(this.id) +
          ']'
      );
    }

    if (this.id instanceof Buffer) {
      hexString = convertToHex(this.id);
      if (ObjectId.cacheHexString) this.__id = hexString;
      return hexString;
    }

    for (let i = 0; i < this.id.length; i++) {
      const hexChar = hexTable[this.id.charCodeAt(i)];
      if (typeof hexChar !== 'string') {
        throw makeObjectIdError(this.id, i);
      }
      hexString += hexChar;
    }

    if (ObjectId.cacheHexString) this.__id = hexString;
    return hexString;
  }

  /**
   * Update the ObjectId index
   * @privateRemarks
   * Used in generating new ObjectId's on the driver
   * @internal
   */
  static getInc(): number {
    return (ObjectId.index = (ObjectId.index + 1) % 0xffffff);
  }

  /**
   * Generate a 12 byte id buffer used in ObjectId's
   *
   * @param time - pass in a second based timestamp.
   */
  static generate(time?: number): Buffer {
    if ('number' !== typeof time) {
      time = ~~(Date.now() / 1000);
    }

    const inc = ObjectId.getInc();
    const buffer = Buffer.alloc(12);

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
   * Converts the id into a 24 character hex string for printing
   *
   * @param format - The Buffer toString format parameter.
   * @internal
   */
  toString(format?: BufferEncoding): string {
    // Is the id a buffer then use the buffer toString method to return the format
    if (this.id && typeof this.id !== 'string' && 'copy' in (this.id as Buffer)) {
      return this.id.toString(typeof format === 'string' ? format : 'hex');
    }

    return this.toHexString();
  }

  /**
   * Converts to its JSON the 24 character hex string representation.
   * @internal
   */
  toJSON(): string {
    return this.toHexString();
  }

  /**
   * Compares the equality of this ObjectId with `otherID`.
   *
   * @param otherId - ObjectId instance to compare against.
   */
  equals(otherId: string | ObjectId | ObjectIdLike): boolean {
    if (otherId === undefined || otherId === null) {
      return false;
    }

    if (otherId instanceof ObjectId) {
      return this.toString() === otherId.toString();
    }

    if (
      typeof otherId === 'string' &&
      ObjectId.isValid(otherId) &&
      otherId.length === 12 &&
      this.id instanceof Buffer
    ) {
      return otherId === this.id.toString('binary');
    }

    if (typeof otherId === 'string' && ObjectId.isValid(otherId) && otherId.length === 24) {
      return otherId.toLowerCase() === this.toHexString();
    }

    if (typeof otherId === 'string' && ObjectId.isValid(otherId) && otherId.length === 12) {
      return otherId === this.id;
    }

    if (
      typeof otherId === 'object' &&
      'toHexString' in otherId &&
      typeof otherId.toHexString === 'function'
    ) {
      return otherId.toHexString() === this.toHexString();
    }

    return false;
  }

  /** Returns the generation date (accurate up to the second) that this ID was generated. */
  getTimestamp(): Date {
    const timestamp = new Date();
    let time: number;
    if (typeof this.id !== 'string') {
      time = this.id.readUInt32BE(0);
    } else {
      time = this.generationTime;
    }
    timestamp.setTime(Math.floor(time) * 1000);
    return timestamp;
  }

  /** @internal */
  static createPk(): ObjectId {
    return new ObjectId();
  }

  /**
   * Creates an ObjectId from a second based number, with the rest of the ObjectId zeroed out. Used for comparisons or sorting the ObjectId.
   *
   * @param time - an integer number representing a number of seconds.
   */
  static createFromTime(time: number): ObjectId {
    const buffer = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    // Encode time into first 4 bytes
    buffer[3] = time & 0xff;
    buffer[2] = (time >> 8) & 0xff;
    buffer[1] = (time >> 16) & 0xff;
    buffer[0] = (time >> 24) & 0xff;
    // Return the new objectId
    return new ObjectId(buffer);
  }

  /**
   * Creates an ObjectId from a hex string representation of an ObjectId.
   *
   * @param hexString - create a ObjectId from a passed in 24 character hexstring.
   */
  static createFromHexString(hexString: string): ObjectId {
    // Throw an error if it's not a valid setup
    if (typeof hexString === 'undefined' || (hexString != null && hexString.length !== 24)) {
      throw new TypeError(
        'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
      );
    }

    // Use Buffer.from method if available
    if (haveBuffer()) {
      return new ObjectId(Buffer.from(hexString, 'hex'));
    }

    // Calculate lengths
    const array = Buffer.alloc(12);

    let n = 0;
    let i = 0;
    while (i < 24) {
      array[n++] =
        (decodeLookup[hexString.charCodeAt(i++)] << 4) | decodeLookup[hexString.charCodeAt(i++)];
    }

    return new ObjectId(array);
  }

  /**
   * Checks if a value is a valid bson ObjectId
   *
   * @param id - ObjectId instance to validate.
   */
  static isValid(id: number | string | ObjectId | Buffer | ObjectIdLike): boolean {
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

    if (id instanceof Buffer && id.length === 12) {
      return true;
    }

    // Duck-Typing detection of ObjectId like objects
    if (typeof id === 'object' && 'toHexString' in id && typeof id.toHexString === 'function') {
      if (typeof id.id === 'string') {
        return id.id.length === 12;
      }
      return id.toHexString().length === 24 && checkForHexRegExp.test(id.id.toString('hex'));
    }

    return false;
  }

  /** @internal */
  toExtendedJSON(): { $oid: string } {
    if (this.toHexString) return { $oid: this.toHexString() };
    return { $oid: this.toString('hex') };
  }

  /** @internal */
  static fromExtendedJSON(doc: { $oid: string }): ObjectId {
    return new ObjectId(doc.$oid);
  }
}

// Deprecated methods
Object.defineProperty(ObjectId.prototype, 'generate', {
  value: deprecate(
    (time: number) => ObjectId.generate(time),
    'Please use the static `ObjectId.generate(time)` instead'
  )
});

Object.defineProperty(ObjectId.prototype, 'getInc', {
  value: deprecate(() => ObjectId.getInc(), 'Please use the static `ObjectId.getInc()` instead')
});

Object.defineProperty(ObjectId.prototype, 'get_inc', {
  value: deprecate(() => ObjectId.getInc(), 'Please use the static `ObjectId.getInc()` instead')
});

Object.defineProperty(ObjectId, 'get_inc', {
  value: deprecate(() => ObjectId.getInc(), 'Please use the static `ObjectId.getInc()` instead')
});

/**
 * Converts to a string representation of this Id.
 *
 * @returns return the 24 character hex string representation.
 * @internal
 */
Object.defineProperty(ObjectId.prototype, inspect.custom || 'inspect', ObjectId.prototype.toString);

Object.defineProperty(ObjectId.prototype, '_bsontype', { value: 'ObjectID' });
