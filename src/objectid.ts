import { BSONValue } from './bson_value';
import { BSONError } from './error';
import { type InspectFn, defaultInspect } from './parser/utils';
import { ByteUtils } from './utils/byte_utils';
import { addV8SnapshotDeserializeCallback } from './utils/v8_snapshot_callback';
import { NumberUtils } from './utils/number_utils';

/** ObjectId hexString cache @internal */
const __idCache = new WeakMap(); // TODO(NODE-6549): convert this to #__id private field when target updated to ES2022

/** byte (0-255): its 2-character lowercase hex pair @internal */
const byteToHex: string[] = [];
for (let n = 0; n < 256; n++) byteToHex.push(n.toString(16).padStart(2, '0'));

/** hex char code: nibble (0-15); indices are the codes of 0-9, a-f, A-F @internal */
const hexCharCodeToNibble = new Int8Array(103);
for (let c = 48; c <= 57; c++) hexCharCodeToNibble[c] = c - 48; // '0'-'9'
for (let c = 65; c <= 70; c++) hexCharCodeToNibble[c] = c - 55; // 'A'-'F'
for (let c = 97; c <= 102; c++) hexCharCodeToNibble[c] = c - 87; // 'a'-'f'

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
  private static index = 0;

  /** Unique sequence for the current process (initialized on first use)
   * @internal
   */
  private static PROCESS_UNIQUE: Uint8Array | null = null;

  /** @internal */
  private static resetState = (): void => {
    this.index = Math.floor(Math.random() * 0x1000000);
    this.PROCESS_UNIQUE = ByteUtils.randomBytes(5);
  };

  static {
    this.resetState();
    // https://nodejs.org/api/v8.html#startup-snapshot-api
    addV8SnapshotDeserializeCallback(this.resetState);
  }

  static cacheHexString: boolean;

  /**
   * The 12 ObjectId bytes packed as four 24-bit integers (bytes 0-2, 3-5, 6-8, 9-11).
   * The 24-bit width keeps each value inside V8's small-integer (Smi) range so it stays stored
   * inline, which keeps the object small. The fields are enumerable own properties, so two
   * ObjectIds with the same bytes stay equal under structural comparison such as deepStrictEqual.
   * @internal
   */
  private i0!: number;
  /** @internal */
  private i1!: number;
  /** @internal */
  private i2!: number;
  /** @internal */
  private i3!: number;

  /** Pack 12 bytes into the four integer fields. @internal */
  private setFromBytes(b: Uint8Array, offset = 0): void {
    this.i0 = (b[offset] << 16) | (b[offset + 1] << 8) | b[offset + 2];
    this.i1 = (b[offset + 3] << 16) | (b[offset + 4] << 8) | b[offset + 5];
    this.i2 = (b[offset + 6] << 16) | (b[offset + 7] << 8) | b[offset + 8];
    this.i3 = (b[offset + 9] << 16) | (b[offset + 10] << 8) | b[offset + 11];
  }

  /**
   * Pack a validated 24-character hex string into the four integer fields. The caller must have
   * already validated the string; every character is assumed to be a hex digit.
   * @internal
   */
  private setFromHex(s: string): void {
    const t = hexCharCodeToNibble;
    this.i0 =
      (t[s.charCodeAt(0)] << 20) |
      (t[s.charCodeAt(1)] << 16) |
      (t[s.charCodeAt(2)] << 12) |
      (t[s.charCodeAt(3)] << 8) |
      (t[s.charCodeAt(4)] << 4) |
      t[s.charCodeAt(5)];
    this.i1 =
      (t[s.charCodeAt(6)] << 20) |
      (t[s.charCodeAt(7)] << 16) |
      (t[s.charCodeAt(8)] << 12) |
      (t[s.charCodeAt(9)] << 8) |
      (t[s.charCodeAt(10)] << 4) |
      t[s.charCodeAt(11)];
    this.i2 =
      (t[s.charCodeAt(12)] << 20) |
      (t[s.charCodeAt(13)] << 16) |
      (t[s.charCodeAt(14)] << 12) |
      (t[s.charCodeAt(15)] << 8) |
      (t[s.charCodeAt(16)] << 4) |
      t[s.charCodeAt(17)];
    this.i3 =
      (t[s.charCodeAt(18)] << 20) |
      (t[s.charCodeAt(19)] << 16) |
      (t[s.charCodeAt(20)] << 12) |
      (t[s.charCodeAt(21)] << 8) |
      (t[s.charCodeAt(22)] << 4) |
      t[s.charCodeAt(23)];
  }

  /** To generate a new ObjectId, use ObjectId() with no argument. */
  constructor();
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
   * Implementation overload.
   *
   * @param inputId - All input types that are used in the constructor implementation.
   */
  constructor(inputId?: string | ObjectId | ObjectIdLike | Uint8Array);
  /**
   * Read 12 bytes from `source` starting at `offset` directly into the packed fields.
   * Used by the deserializer on a hot path.
   * @internal
   */
  constructor(source: Uint8Array, offset: number);
  /**
   * Create a new ObjectId.
   *
   * @param inputId - An input value to create a new ObjectId from.
   */
  constructor(inputId?: string | ObjectId | ObjectIdLike | Uint8Array, offset?: number) {
    super();
    if (typeof offset === 'number') {
      // Fast path used by the deserializer: read the 12 bytes directly from source at offset.
      this.setFromBytes(inputId as Uint8Array, offset);
      return;
    }
    // workingId is set based on type of input and whether valid id exists for the input
    let workingId;
    if (typeof inputId === 'object' && inputId && 'id' in inputId) {
      if (
        ObjectId.is(inputId) &&
        typeof inputId.i0 === 'number' &&
        typeof inputId.i1 === 'number' &&
        typeof inputId.i2 === 'number' &&
        typeof inputId.i3 === 'number'
      ) {
        // Same-build ObjectId: copy the packed fields directly. The general path below would
        // hit the id getter (which allocates) and then re-decode a hex round trip.
        this.i0 = inputId.i0;
        this.i1 = inputId.i1;
        this.i2 = inputId.i2;
        this.i3 = inputId.i3;
        return;
      }
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

    // The following cases use workingId to construct an ObjectId
    if (workingId == null) {
      // The most common use case (blank id, new objectId instance):
      // generate a new id directly into the packed fields.
      const time = Math.floor(Date.now() / 1000);
      const inc = ObjectId.getInc();
      const pu = ObjectId.PROCESS_UNIQUE!;
      this.i0 = (time >>> 8) & 0xffffff;
      this.i1 = ((time & 0xff) << 16) | (pu[0] << 8) | pu[1];
      this.i2 = (pu[2] << 16) | (pu[3] << 8) | pu[4];
      this.i3 = inc & 0xffffff;
    } else if (ArrayBuffer.isView(workingId) && workingId.byteLength === 12) {
      // Normalize a non-Uint8Array view (DataView, Int8Array, ...) to a byte buffer so its
      // bytes are read correctly.
      this.setFromBytes(
        workingId instanceof Uint8Array ? workingId : ByteUtils.toLocalBufferType(workingId)
      );
    } else if (typeof workingId === 'string') {
      if (ObjectId.validateHexString(workingId)) {
        this.setFromHex(workingId);
        // If we are caching the hex string
        if (ObjectId.cacheHexString) {
          __idCache.set(this, workingId);
        }
      } else {
        throw new BSONError(
          'input must be a 24 character hex string, 12 byte Uint8Array, or an integer'
        );
      }
    } else {
      throw new BSONError('Argument passed in does not match the accepted types');
    }
  }

  /**
   * The ObjectId bytes, rebuilt from the packed integer fields on each access. Every read
   * returns a freshly allocated 12-byte buffer.
   * @readonly
   */
  get id(): Uint8Array {
    const b = ByteUtils.allocateUnsafe(12);
    b[0] = (this.i0 >>> 16) & 0xff;
    b[1] = (this.i0 >>> 8) & 0xff;
    b[2] = this.i0 & 0xff;
    b[3] = (this.i1 >>> 16) & 0xff;
    b[4] = (this.i1 >>> 8) & 0xff;
    b[5] = this.i1 & 0xff;
    b[6] = (this.i2 >>> 16) & 0xff;
    b[7] = (this.i2 >>> 8) & 0xff;
    b[8] = this.i2 & 0xff;
    b[9] = (this.i3 >>> 16) & 0xff;
    b[10] = (this.i3 >>> 8) & 0xff;
    b[11] = this.i3 & 0xff;
    return b;
  }

  set id(value: Uint8Array) {
    const bytes = value instanceof Uint8Array ? value : ByteUtils.toLocalBufferType(value);
    this.setFromBytes(bytes);
    if (ObjectId.cacheHexString) {
      __idCache.set(this, ByteUtils.toHex(bytes));
    }
  }

  /**
   * @internal
   * Validates the input string is a valid hex representation of an ObjectId.
   */
  private static validateHexString(string: string): boolean {
    if (string?.length !== 24) return false;
    for (let i = 0; i < 24; i++) {
      const char = string.charCodeAt(i);
      if (
        // Check for ASCII 0-9
        (char >= 48 && char <= 57) ||
        // Check for ASCII a-f
        (char >= 97 && char <= 102) ||
        // Check for ASCII A-F
        (char >= 65 && char <= 70)
      ) {
        continue;
      }
      return false;
    }
    return true;
  }

  /** Returns the ObjectId id as a 24 lowercase character hex string representation */
  toHexString(): string {
    if (ObjectId.cacheHexString) {
      const __id = __idCache.get(this);
      if (__id) return __id;
    }

    // Encode the four packed integers to hex via a byte->pair lookup table.
    const i0 = this.i0;
    const i1 = this.i1;
    const i2 = this.i2;
    const i3 = this.i3;
    const hexString =
      byteToHex[(i0 >>> 16) & 0xff] +
      byteToHex[(i0 >>> 8) & 0xff] +
      byteToHex[i0 & 0xff] +
      byteToHex[(i1 >>> 16) & 0xff] +
      byteToHex[(i1 >>> 8) & 0xff] +
      byteToHex[i1 & 0xff] +
      byteToHex[(i2 >>> 16) & 0xff] +
      byteToHex[(i2 >>> 8) & 0xff] +
      byteToHex[i2 & 0xff] +
      byteToHex[(i3 >>> 16) & 0xff] +
      byteToHex[(i3 >>> 8) & 0xff] +
      byteToHex[i3 & 0xff];

    if (ObjectId.cacheHexString) {
      __idCache.set(this, hexString);
    }

    return hexString;
  }

  /**
   * Update the ObjectId index
   * @internal
   */
  private static getInc(): number {
    return (ObjectId.index = (ObjectId.index + 1) % 0x1000000);
  }

  /**
   * Generate a 12 byte id buffer used in ObjectId's
   *
   * @param time - pass in a second based timestamp.
   */
  static generate(time?: number): Uint8Array {
    if ('number' !== typeof time) {
      time = Math.floor(Date.now() / 1000);
    }

    const inc = ObjectId.getInc();
    const buffer = ByteUtils.allocateUnsafe(12);

    // 4-byte timestamp
    NumberUtils.setInt32BE(buffer, 0, time);

    // 5-byte process unique
    const PROCESS_UNIQUE = this.PROCESS_UNIQUE!;
    buffer[4] = PROCESS_UNIQUE[0];
    buffer[5] = PROCESS_UNIQUE[1];
    buffer[6] = PROCESS_UNIQUE[2];
    buffer[7] = PROCESS_UNIQUE[3];
    buffer[8] = PROCESS_UNIQUE[4];

    // 3-byte counter
    buffer[11] = inc & 0xff;
    buffer[10] = (inc >>> 8) & 0xff;
    buffer[9] = (inc >>> 16) & 0xff;

    return buffer;
  }

  /**
   * Converts the id into a 24 character hex string for printing, unless encoding is provided.
   * @param encoding - hex or base64
   */
  toString(encoding?: 'hex' | 'base64'): string {
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

    if (
      ObjectId.is(otherId) &&
      typeof otherId.i0 === 'number' &&
      typeof otherId.i1 === 'number' &&
      typeof otherId.i2 === 'number' &&
      typeof otherId.i3 === 'number'
    ) {
      // Same-build ObjectId (all four packed fields present): compare them directly. i3 (the
      // counter / low bytes) differs most often between two ids, so checking it first fails fast.
      return (
        this.i3 === otherId.i3 &&
        this.i0 === otherId.i0 &&
        this.i1 === otherId.i1 &&
        this.i2 === otherId.i2
      );
    }

    if (typeof otherId === 'string') {
      return otherId.toLowerCase() === this.toHexString();
    }

    if (typeof otherId === 'object' && typeof otherId.toHexString === 'function') {
      // ObjectId-like values, and ObjectIds from a different bson build, compare by their
      // public hex representation.
      const otherIdString = otherId.toHexString();
      const thisIdString = this.toHexString();
      return typeof otherIdString === 'string' && otherIdString.toLowerCase() === thisIdString;
    }

    return false;
  }

  /** Returns the generation date (accurate up to the second) that this ID was generated. */
  getTimestamp(): Date {
    const timestamp = new Date();
    // Bytes 0-3 (the big-endian timestamp) are i0's three bytes followed by i1's top byte.
    const time = this.i0 * 0x100 + (this.i1 >>> 16);
    timestamp.setTime(time * 1000);
    return timestamp;
  }

  /** @internal */
  static createPk(): ObjectId {
    return new ObjectId();
  }

  /** @internal */
  serializeInto(uint8array: Uint8Array, index: number): 12 {
    uint8array[index] = (this.i0 >>> 16) & 0xff;
    uint8array[index + 1] = (this.i0 >>> 8) & 0xff;
    uint8array[index + 2] = this.i0 & 0xff;
    uint8array[index + 3] = (this.i1 >>> 16) & 0xff;
    uint8array[index + 4] = (this.i1 >>> 8) & 0xff;
    uint8array[index + 5] = this.i1 & 0xff;
    uint8array[index + 6] = (this.i2 >>> 16) & 0xff;
    uint8array[index + 7] = (this.i2 >>> 8) & 0xff;
    uint8array[index + 8] = this.i2 & 0xff;
    uint8array[index + 9] = (this.i3 >>> 16) & 0xff;
    uint8array[index + 10] = (this.i3 >>> 8) & 0xff;
    uint8array[index + 11] = this.i3 & 0xff;
    return 12;
  }

  /**
   * Creates an ObjectId from a second based number, with the rest of the ObjectId zeroed out. Used for comparisons or sorting the ObjectId.
   *
   * @param time - an integer number representing a number of seconds.
   */
  static createFromTime(time: number): ObjectId {
    const buffer = ByteUtils.allocate(12);
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
  static isValid(id: string | ObjectId | ObjectIdLike | Uint8Array): boolean {
    if (id == null) return false;
    if (typeof id === 'string') return ObjectId.validateHexString(id);

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

  /** @internal */
  private isCached(): boolean {
    return ObjectId.cacheHexString && __idCache.has(this);
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
