import { BSONValue } from './bson_value';
import { BSONError } from './error';
import { type InspectFn, defaultInspect } from './parser/utils';
import { ByteUtils } from './utils/byte_utils';
import { NumberUtils } from './utils/number_utils';

let currentPool: Uint8Array | null = null;
let poolSize = 1000; // Default: Hold 1000 ObjectId buffers in a pool
let currentPoolOffset = 0;

/**
 * Retrieves a ObjectId pool and offset. This function may create a new ObjectId buffer pool and reset the pool offset
 * @internal
 */
function getPool(): [Uint8Array, number] {
  if (!currentPool || currentPoolOffset + 12 > currentPool.byteLength) {
    currentPool = ByteUtils.allocateUnsafe(poolSize * 12);
    currentPoolOffset = 0;
  }
  return [currentPool, currentPoolOffset];
}

/**
 * Increments the pool offset by 12 bytes
 * @internal
 */
function incrementPool(): void {
  currentPoolOffset += 12;
}

// Regular expression that checks for hex value
const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');

// Unique sequence for the current process (initialized on first use)
let PROCESS_UNIQUE: Uint8Array | null = null;

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

  static cacheHexString: boolean;

  /**
   * The size of the current ObjectId buffer pool.
   */
  static get poolSize(): number {
    return poolSize;
  }

  static set poolSize(size: number) {
    const iSize = Math.ceil(size); // Ensure new pool size is an integer
    if (iSize <= 0) {
      throw new BSONError('poolSize must be a positive integer greater than 0');
    }
    poolSize = iSize;
  }

  /** ObjectId buffer pool pointer @internal */
  private pool: Uint8Array;
  /** Buffer pool offset @internal */
  private offset: number;

  /** ObjectId hexString cache @internal */
  private __id?: string;

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
  constructor(inputId: Uint8Array);
  /**
   * Create ObjectId from a large binary Buffer. Only 12 bytes starting from the offset are used.
   * @internal
   * @param inputId - A 12 byte binary Buffer.
   * @param inputIndex - The offset to start reading the inputId buffer.
   */
  constructor(inputId: Uint8Array, inputIndex?: number);
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
    inputIndex?: number
  ) {
    super();
    // workingId is set based on type of input and whether valid id exists for the input
    let workingId;
    if (typeof inputId === 'object' && inputId && 'id' in inputId) {
      if (typeof inputId.id !== 'string' && !ArrayBuffer.isView(inputId.id)) {
        throw new BSONError('Argument passed in must have an id that is of type string or Buffer');
      }
      if ('toHexString' in inputId && typeof inputId.toHexString === 'function') {
        workingId = ByteUtils.fromHex(inputId.toHexString());
      } else {
        workingId = inputId.id;
      }
    } else {
      workingId = inputId;
    }

    const [pool, offset] = getPool();

    // The following cases use workingId to construct an ObjectId
    if (workingId == null || typeof workingId === 'number') {
      // The most common use case (blank id, new objectId instance)
      // Generate a new id
      ObjectId.generate(typeof workingId === 'number' ? workingId : undefined, pool, offset);
    } else if (ArrayBuffer.isView(workingId)) {
      if (workingId.byteLength !== 12 && typeof inputIndex !== 'number') {
        throw new BSONError('Buffer length must be 12 or offset must be specified');
      }
      if (
        inputIndex &&
        (typeof inputIndex !== 'number' || inputIndex < 0 || workingId.byteLength < inputIndex + 12)
      ) {
        throw new BSONError('Buffer offset must be a non-negative number less than buffer length');
      }
      inputIndex ??= 0;
      for (let i = 0; i < 12; i++) pool[offset + i] = workingId[inputIndex + i];
    } else if (typeof workingId === 'string') {
      if (workingId.length === 24 && checkForHexRegExp.test(workingId)) {
        pool.set(ByteUtils.fromHex(workingId), offset);
      } else {
        throw new BSONError(
          'input must be a 24 character hex string, 12 byte Uint8Array, or an integer'
        );
      }
    } else {
      throw new BSONError('Argument passed in does not match the accepted types');
    }
    // If we are caching the hex string
    if (ObjectId.cacheHexString) {
      this.__id = ByteUtils.toHex(pool, offset, offset + 12);
    }
    // Increment pool offset once we have completed initialization
    this.pool = pool;
    this.offset = offset;
    incrementPool();
  }

  /** ObjectId bytes @internal */
  get buffer(): Uint8Array {
    return this.id;
  }

  /**
   * The ObjectId bytes
   * @readonly
   */
  get id(): Uint8Array {
    return this.pool.subarray(this.offset, this.offset + 12);
  }

  set id(value: Uint8Array) {
    if (value.byteLength !== 12) {
      throw new BSONError('input must be a 12 byte Uint8Array');
    }
    this.pool.set(value, this.offset);
    if (ObjectId.cacheHexString) {
      this.__id = ByteUtils.toHex(value);
    }
  }

  /** Returns the ObjectId id as a 24 lowercase character hex string representation */
  toHexString(): string {
    if (ObjectId.cacheHexString && this.__id) {
      return this.__id;
    }

    const hexString = ByteUtils.toHex(this.pool, this.offset, this.offset + 12);

    if (ObjectId.cacheHexString && !this.__id) {
      this.__id = hexString;
    }

    return hexString;
  }

  /**
   * Update the ObjectId index
   * @internal
   */
  private static getInc(): number {
    return (ObjectId.index = (ObjectId.index + 1) % 0xffffff);
  }

  /**
   * Generate a 12 byte id buffer used in ObjectId's
   *
   * @param time - pass in a second based timestamp.
   * @param buffer - Optionally pass in a buffer instance.
   * @param offset - Optionally pass in a buffer offset.
   */
  static generate(time?: number, buffer?: Uint8Array, offset: number = 0): Uint8Array {
    if ('number' !== typeof time) {
      time = Math.floor(Date.now() / 1000);
    }

    const inc = ObjectId.getInc();
    if (!buffer) {
      buffer = ByteUtils.allocateUnsafe(12);
    }

    // 4-byte timestamp
    NumberUtils.setInt32BE(buffer, offset, time);

    // set PROCESS_UNIQUE if yet not initialized
    if (PROCESS_UNIQUE === null) {
      PROCESS_UNIQUE = ByteUtils.randomBytes(5);
    }

    // 5-byte process unique
    buffer[offset + 4] = PROCESS_UNIQUE[0];
    buffer[offset + 5] = PROCESS_UNIQUE[1];
    buffer[offset + 6] = PROCESS_UNIQUE[2];
    buffer[offset + 7] = PROCESS_UNIQUE[3];
    buffer[offset + 8] = PROCESS_UNIQUE[4];

    // 3-byte counter
    buffer[offset + 11] = inc & 0xff;
    buffer[offset + 10] = (inc >> 8) & 0xff;
    buffer[offset + 9] = (inc >> 16) & 0xff;

    return buffer;
  }

  /**
   * Converts the id into a 24 character hex string for printing, unless encoding is provided.
   * @param encoding - hex or base64
   */
  toString(encoding?: 'hex' | 'base64'): string {
    // Is the id a buffer then use the buffer toString method to return the format
    if (encoding === 'base64') return ByteUtils.toBase64(this.id);
    if (encoding === 'hex') return this.toHexString();
    return this.toHexString();
  }

  /** Converts to its JSON the 24 character hex string representation. */
  toJSON(): string {
    return this.toHexString();
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
      if (otherId.pool && typeof otherId.offset === 'number') {
        for (let i = 11; i >= 0; i--) {
          if (this.pool[this.offset + i] !== otherId.pool[otherId.offset + i]) {
            return false;
          }
        }
        return true;
      }
      // If otherId does not have pool and offset, fallback to buffer comparison for compatibility
      return ByteUtils.equals(this.buffer, otherId.buffer);
    }

    if (typeof otherId === 'string') {
      return otherId.toLowerCase() === this.toHexString();
    }

    if (typeof otherId === 'object' && typeof otherId.toHexString === 'function') {
      const otherIdString = otherId.toHexString();
      const thisIdString = this.toHexString();
      return typeof otherIdString === 'string' && otherIdString.toLowerCase() === thisIdString;
    }

    return false;
  }

  /** Returns the generation date (accurate up to the second) that this ID was generated. */
  getTimestamp(): Date {
    const timestamp = new Date();
    const time = NumberUtils.getUint32BE(this.pool, this.offset);
    timestamp.setTime(Math.floor(time) * 1000);
    return timestamp;
  }

  /** @internal */
  static createPk(): ObjectId {
    return new ObjectId();
  }

  /** @internal */
  serializeInto(uint8array: Uint8Array, index: number): 12 {
    const pool = this.pool;
    const offset = this.offset;
    uint8array[index] = pool[offset];
    uint8array[index + 1] = pool[offset + 1];
    uint8array[index + 2] = pool[offset + 2];
    uint8array[index + 3] = pool[offset + 3];
    uint8array[index + 4] = pool[offset + 4];
    uint8array[index + 5] = pool[offset + 5];
    uint8array[index + 6] = pool[offset + 6];
    uint8array[index + 7] = pool[offset + 7];
    uint8array[index + 8] = pool[offset + 8];
    uint8array[index + 9] = pool[offset + 9];
    uint8array[index + 10] = pool[offset + 10];
    uint8array[index + 11] = pool[offset + 11];
    return 12;
  }

  /**
   * Creates an ObjectId from a second based number, with the rest of the ObjectId zeroed out. Used for comparisons or sorting the ObjectId.
   *
   * @param time - an integer number representing a number of seconds.
   */
  static createFromTime(time: number): ObjectId {
    const buffer = ByteUtils.allocateUnsafe(12);
    for (let i = 11; i >= 4; i--) buffer[i] = 0;
    // Encode time into first 4 bytes
    NumberUtils.setInt32BE(buffer, 0, time);
    // Return the new objectId
    return new ObjectId(buffer);
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

    return new ObjectId(ByteUtils.fromHex(hexString));
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

    try {
      new ObjectId(id);
      return true;
    } catch {
      return false;
    }
  }

  /** @internal */
  toExtendedJSON(): ObjectIdExtended {
    if (this.toHexString) return { $oid: this.toHexString() };
    return { $oid: this.toString('hex') };
  }

  /** @internal */
  static fromExtendedJSON(doc: ObjectIdExtended): ObjectId {
    return new ObjectId(doc.$oid);
  }

  /**
   * Converts to a string representation of this Id.
   *
   * @returns return the 24 character hex string representation.
   */
  inspect(depth?: number, options?: unknown, inspect?: InspectFn): string {
    inspect ??= defaultInspect;
    return `new ObjectId(${inspect(this.toHexString(), options)})`;
  }
}
