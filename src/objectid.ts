import { BSONValue } from './bson_value';
import { BSONError } from './error';
import { type InspectFn, defaultInspect } from './parser/utils';
import { ByteUtils } from './utils/byte_utils';
import { flattenString } from './utils/string_utils';

// Regular expression that checks for hex value
const checkForHexRegExp = new RegExp('^[0-9a-f]{24}$');

// Unique sequence for the current process (initialized on first use)
let PROCESS_UNIQUE: string | null = null;

const OID_SKIP_VALIDATE = Symbol();

/** @public */
export interface ObjectIdLike {
  id: string | Uint8Array;
  __id?: string;
  toHexString(): string;
}

/** @public */
export interface ObjectIdExtended {
  $oid: string;
}

/**
 * A class representation of the BSON ObjectId type.
 * @public
 * @category BSONType
 */
export class ObjectId extends BSONValue {
  get _bsontype(): 'ObjectId' {
    return 'ObjectId';
  }

  /** @internal */
  private static index = Math.floor(Math.random() * 0xffffff);
  /** @internal */
  private static lastTimeGenerate?: number;
  /** @internal */
  private static timeHexCache?: string;

  /** @deprecated Hex string is always cached */
  static cacheHexString: boolean;

  /**
   * Cache buffer internally
   * Uses much more memory but can speed up performance if performing lots of buffer specific tasks
   */
  static cacheBuffer: boolean;

  /** ObjectId Bytes @internal */
  private buffer?: Uint8Array;
  /** ObjectId hexString cache @internal */
  private __id: string;

  /**
   * Create ObjectId from a number.
   *
   * @param inputId - A number.
   * @deprecated Instead, use `static createFromTime()` to set a numeric value for the new ObjectId.
   */
  constructor(inputId: number);
  /**
   * Create ObjectId from a 24 character hex string.
   *
   * @param inputId - A 24 character hex string.
   */
  constructor(inputId: string);
  /** @internal */
  constructor(inputId: string, _internalFlag?: symbol);
  /**
   * Create ObjectId from the BSON ObjectId type.
   *
   * @param inputId - The BSON ObjectId type.
   */
  constructor(inputId: ObjectId);
  /**
   * Create ObjectId from the object type that has the toHexString method.
   *
   * @param inputId - The ObjectIdLike type.
   */
  constructor(inputId: ObjectIdLike);
  /**
   * Create ObjectId from a 12 byte binary Buffer.
   *
   * @param inputId - A 12 byte binary Buffer.
   */
  constructor(inputId: Uint8Array, offset?: number);
  /** To generate a new ObjectId, use ObjectId() with no argument. */
  constructor();
  /**
   * Implementation overload.
   *
   * @param inputId - All input types that are used in the constructor implementation.
   */
  constructor(inputId?: string | number | ObjectId | ObjectIdLike | Uint8Array);
  /**
   * Create a new ObjectId.
   *
   * @param inputId - An input value to create a new ObjectId from.
   */
  constructor(
    inputId?: string | number | ObjectId | ObjectIdLike | Uint8Array,
    option?: symbol | number
  ) {
    let bufferCache: Uint8Array | undefined;
    super();
    // workingId is set based on type of input and whether valid id exists for the input
    let workingId;
    if (typeof inputId === 'object' && inputId && 'id' in inputId) {
      if (typeof inputId.id !== 'string' && !ArrayBuffer.isView(inputId.id)) {
        throw new BSONError('Argument passed in must have an id that is of type string or Buffer');
      }
      if ('toHexString' in inputId && typeof inputId.toHexString === 'function') {
        workingId = inputId.toHexString();
        option = OID_SKIP_VALIDATE;
      } else {
        workingId = inputId.id;
      }
    } else {
      workingId = inputId;
    }

    // The following cases use workingId to construct an ObjectId
    if (typeof workingId === 'string') {
      if (option === OID_SKIP_VALIDATE) {
        this.__id = workingId;
      } else {
        const validString = ObjectId.validateHexString(workingId);
        if (validString) {
          this.__id = validString;
        } else {
          throw new BSONError(
            'input must be a 24 character hex string, 12 byte Uint8Array, or an integer'
          );
        }
      }
    } else if (workingId == null || typeof workingId === 'number') {
      // The most common use case (blank id, new objectId instance)
      // Generate a new id
      this.__id = ObjectId.generate(typeof workingId === 'number' ? workingId : undefined);
    } else if (ArrayBuffer.isView(workingId)) {
      if (option == null && workingId.byteLength !== 12) {
        throw new BSONError('Buffer length must be 12 or offset must be specified');
      }
      if (
        option &&
        (typeof option !== 'number' || option < 0 || workingId.byteLength < option + 12)
      ) {
        throw new BSONError('Buffer offset must be a non-negative number less than buffer length');
      }
      // If intstanceof matches we can escape calling ensure buffer in Node.js environments
      bufferCache = ByteUtils.toLocalBufferType(workingId);
      const offset = option || 0;
      this.__id = ByteUtils.toHex(bufferCache, offset, offset + 12);
    } else {
      throw new BSONError('Argument passed in does not match the accepted types');
    }
    // If we are caching the buffer
    if (ObjectId.cacheBuffer) {
      this.buffer = bufferCache || ByteUtils.fromHex(this.__id);
    }
  }

  /**
   * The ObjectId bytes
   * @readonly
   */
  get id(): Uint8Array {
    return this.buffer || ByteUtils.fromHex(this.__id);
  }

  set id(value: Uint8Array) {
    this.__id = ByteUtils.toHex(value);
  }

  /** Returns the ObjectId id as a 24 lowercase character hex string representation */
  toHexString(): string {
    return this.__id;
  }

  /**
   * @internal
   * Validates the input string is a valid hex representation of an ObjectId.
   * If valid, returns the input string. Otherwise, returns false.
   * Returned string is lowercase.
   */
  private static validateHexString(input: string): false | string {
    if (input == null) return false;
    if (input.length !== 24) return false;
    if (checkForHexRegExp.test(input)) return input;
    const inputLower = input.toLowerCase();
    if (checkForHexRegExp.test(inputLower)) return inputLower;
    return false;
  }

  /**
   * Update the ObjectId index
   * @internal
   */
  private static getInc(): number {
    return (ObjectId.index = (ObjectId.index + 1) % 0xffffff);
  }

  /**
   * Generates the hex timestamp from a second based number or the current time.
   * @internal
   */
  private static getTimeHex(time?: number): string {
    if ('number' !== typeof time) {
      time = Math.floor(Date.now() / 1000);
    } else {
      time = (time | 0) % 0xffffffff;
    }

    if (!ObjectId.timeHexCache || time !== ObjectId.lastTimeGenerate) {
      ObjectId.lastTimeGenerate = time;
      // This is moderately expensive so we can cache this for repetitive calls
      ObjectId.timeHexCache = time.toString(16);
      // Dates before 1978-07-05T00:00:00.000Z can be represented in less than 8 hex digits so we need to padStart
      if (ObjectId.timeHexCache.length < 8) {
        ObjectId.timeHexCache = ObjectId.timeHexCache.padStart(8, '0');
      }
    }
    return ObjectId.timeHexCache;
  }

  /**
   * Generate a 12 byte id buffer used in ObjectId's
   *
   * @param time - pass in a second based timestamp.
   */
  static generate(time?: number): string {
    const inc = ObjectId.getInc();

    // 4-byte timestamp
    const timeString = ObjectId.getTimeHex(time);

    // set PROCESS_UNIQUE if yet not initialized
    if (PROCESS_UNIQUE === null) {
      PROCESS_UNIQUE = ByteUtils.toHex(ByteUtils.randomBytes(5));
    }

    // 3-byte counter
    const incString = inc.toString(16).padStart(6, '0');

    // Flatten concatenated string to save memory
    return flattenString(timeString + PROCESS_UNIQUE + incString);
  }

  /**
   * Converts the id into a 24 character hex string for printing, unless encoding is provided.
   * @param encoding - hex or base64
   */
  toString(encoding?: 'hex' | 'base64'): string {
    // Is the id a buffer then use the buffer toString method to return the format
    if (encoding === 'base64') return ByteUtils.toBase64(this.id);
    if (encoding === 'hex') return this.__id;
    return this.__id;
  }

  /** Converts to its JSON the 24 character hex string representation. */
  toJSON(): string {
    return this.__id;
  }

  /** @internal */
  private static is(variable: unknown): variable is ObjectId {
    return (
      variable != null &&
      typeof variable === 'object' &&
      '_bsontype' in variable &&
      variable._bsontype === 'ObjectId'
    );
  }

  /**
   * Compares the equality of this ObjectId with `otherID`.
   *
   * @param otherId - ObjectId instance to compare against.
   */
  equals(otherId: string | ObjectId | ObjectIdLike | undefined | null): boolean {
    if (otherId === undefined || otherId === null) {
      return false;
    }

    if (ObjectId.is(otherId)) {
      return this.__id === otherId.__id;
    }

    if (typeof otherId === 'string') {
      return otherId === this.__id || otherId.toLowerCase() === this.__id;
    }

    if (typeof otherId === 'object' && typeof otherId.toHexString === 'function') {
      const otherIdString = otherId.toHexString();
      const thisIdString = this.__id;
      return typeof otherIdString === 'string' && otherIdString.toLowerCase() === thisIdString;
    }

    return false;
  }

  /** Returns the generation date (accurate up to the second) that this ID was generated. */
  getTimestamp(): Date {
    return new Date(parseInt(this.__id.substring(0, 8), 16) * 1000);
  }

  /** @internal */
  static createPk(): ObjectId {
    return new ObjectId();
  }

  /** @internal */
  serializeInto(uint8array: Uint8Array, index: number): 12 {
    let temp = parseInt(this.__id.substring(0, 8), 16);

    uint8array[index + 3] = temp & 0xff;
    uint8array[index + 2] = (temp >> 8) & 0xff;
    uint8array[index + 1] = (temp >> 16) & 0xff;
    uint8array[index] = (temp >> 24) & 0xff;

    temp = parseInt(this.__id.substring(8, 16), 16);

    uint8array[index + 7] = temp & 0xff;
    uint8array[index + 6] = (temp >> 8) & 0xff;
    uint8array[index + 5] = (temp >> 16) & 0xff;
    uint8array[index + 4] = (temp >> 24) & 0xff;

    temp = parseInt(this.__id.substring(16, 24), 16);

    uint8array[index + 11] = temp & 0xff;
    uint8array[index + 10] = (temp >> 8) & 0xff;
    uint8array[index + 9] = (temp >> 16) & 0xff;
    uint8array[index + 8] = (temp >> 24) & 0xff;
    return 12;
  }

  /**
   * Creates an ObjectId from a second based number, with the rest of the ObjectId zeroed out. Used for comparisons or sorting the ObjectId.
   *
   * @param time - an integer number representing a number of seconds.
   */
  static createFromTime(time: number): ObjectId {
    // Return the new objectId
    return new ObjectId(time);
  }

  /**
   * Creates an ObjectId from a hex string representation of an ObjectId.
   *
   * @param hexString - create a ObjectId from a passed in 24 character hexstring.
   */
  static createFromHexString(hexString: string): ObjectId {
    if (hexString?.length !== 24) {
      throw new BSONError('hex string must be 24 characters');
    }

    return new ObjectId(hexString);
  }

  /** Creates an ObjectId instance from a base64 string */
  static createFromBase64(base64: string): ObjectId {
    if (base64?.length !== 16) {
      throw new BSONError('base64 string must be 16 characters');
    }

    return new ObjectId(ByteUtils.fromBase64(base64));
  }

  /**
   * Checks if a value can be used to create a valid bson ObjectId
   * @param id - any JS value
   */
  static isValid(id: string | number | ObjectId | ObjectIdLike | Uint8Array): boolean {
    if (id == null) return false;
    if (typeof id === 'string') return !!ObjectId.validateHexString(id);

    try {
      new ObjectId(id);
      return true;
    } catch {
      return false;
    }
  }

  /** @internal */
  toExtendedJSON(): ObjectIdExtended {
    return { $oid: this.__id };
  }

  /** @internal */
  static fromExtendedJSON(doc: ObjectIdExtended): ObjectId {
    return new ObjectId(doc.$oid, OID_SKIP_VALIDATE);
  }

  /**
   * Converts to a string representation of this Id.
   *
   * @returns return the 24 character hex string representation.
   */
  inspect(depth?: number, options?: unknown, inspect?: InspectFn): string {
    inspect ??= defaultInspect;
    return `new ObjectId(${inspect(this.__id, options)})`;
  }
}
