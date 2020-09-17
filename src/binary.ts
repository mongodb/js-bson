import { Buffer } from 'buffer';
import type { EJSONOptions } from './extended_json';
import { haveBuffer, isBuffer, isUint8Array } from './parser/utils';

type BinarySequence = Uint8Array | Buffer | number[];

export interface BinaryExtendedLegacy {
  $type: string;
  $binary: string;
}

export interface BinaryExtended {
  $binary: {
    subType: string;
    base64: string;
  };
}

/** A class representation of the BSON Binary type. */
export class Binary {
  _bsontype!: 'Binary';

  /** Initial buffer default size */
  static readonly BUFFER_SIZE = 256;
  /** Default BSON type */
  static readonly SUBTYPE_DEFAULT = 0;
  /** Function BSON type */
  static readonly SUBTYPE_FUNCTION = 1;
  /** Byte Array BSON type */
  static readonly SUBTYPE_BYTE_ARRAY = 2;
  /** Deprecated UUID BSON type @deprecated Please use SUBTYPE_UUID */
  static readonly SUBTYPE_UUID_OLD = 3;
  /** UUID BSON type */
  static readonly SUBTYPE_UUID = 4;
  /** MD5 BSON type */
  static readonly SUBTYPE_MD5 = 5;
  /** User BSON type */
  static readonly SUBTYPE_USER_DEFINED = 128;

  buffer: BinarySequence;
  sub_type: number;
  position: number;

  /**
   * @param buffer - a buffer object containing the binary data.
   * @param subType - the option binary type.
   */
  constructor(buffer: string | BinarySequence, subType?: number) {
    if (
      buffer != null &&
      !(typeof buffer === 'string') &&
      !Buffer.isBuffer(buffer) &&
      !(buffer instanceof Uint8Array) &&
      !Array.isArray(buffer)
    ) {
      throw new TypeError('only String, Buffer, Uint8Array or Array accepted');
    }

    this.sub_type = subType == null ? BSON_BINARY_SUBTYPE_DEFAULT : subType;
    this.position = 0;

    if (buffer != null && !(buffer instanceof Number)) {
      // Only accept Buffer, Uint8Array or Arrays
      if (typeof buffer === 'string') {
        // Different ways of writing the length of the string for the different types
        if (haveBuffer()) {
          this.buffer = Buffer.from(buffer);
        } else if (typeof Uint8Array !== 'undefined' || Array.isArray(buffer)) {
          this.buffer = writeStringToArray(buffer);
        } else {
          throw new TypeError('only String, Buffer, Uint8Array or Array accepted');
        }
      } else {
        this.buffer = buffer;
      }
      this.position = buffer.length;
    } else {
      if (haveBuffer()) {
        this.buffer = Buffer.alloc(Binary.BUFFER_SIZE);
      } else if (typeof Uint8Array !== 'undefined') {
        this.buffer = new Uint8Array(new ArrayBuffer(Binary.BUFFER_SIZE));
      } else {
        this.buffer = new Array(Binary.BUFFER_SIZE);
      }
    }
  }

  /**
   * Updates this binary with byte_value.
   *
   * @param byteValue - a single byte we wish to write.
   */
  put(byteValue: string | number | Uint8Array | Buffer | number[]): void {
    // If it's a string and a has more than one character throw an error
    if (typeof byteValue === 'string' && byteValue.length !== 1) {
      throw new TypeError('only accepts single character String');
    } else if (typeof byteValue !== 'number' && byteValue.length !== 1)
      throw new TypeError('only accepts single character Uint8Array or Array');

    // Decode the byte value once
    let decodedByte: number;
    if (typeof byteValue === 'string') {
      decodedByte = byteValue.charCodeAt(0);
    } else if (typeof byteValue === 'number') {
      decodedByte = byteValue;
    } else {
      decodedByte = byteValue[0];
    }

    if (decodedByte < 0 || decodedByte > 255) {
      throw new TypeError('only accepts number in a valid unsigned byte range 0-255');
    }

    if (this.buffer.length > this.position) {
      this.buffer[this.position++] = decodedByte;
    } else {
      if (isBuffer(this.buffer)) {
        // Create additional overflow buffer
        const buffer = Buffer.alloc(Binary.BUFFER_SIZE + this.buffer.length);
        // Combine the two buffers together
        this.buffer.copy(buffer, 0, 0, this.buffer.length);
        this.buffer = buffer;
        this.buffer[this.position++] = decodedByte;
      } else {
        let buffer: Uint8Array | number[];
        // Create a new buffer (typed or normal array)
        if (isUint8Array(this.buffer)) {
          buffer = new Uint8Array(new ArrayBuffer(Binary.BUFFER_SIZE + this.buffer.length));
        } else {
          buffer = new Array(Binary.BUFFER_SIZE + this.buffer.length);
        }

        // We need to copy all the content to the new array
        for (let i = 0; i < this.buffer.length; i++) {
          buffer[i] = this.buffer[i];
        }

        // Reassign the buffer
        this.buffer = buffer;
        // Write the byte
        this.buffer[this.position++] = decodedByte;
      }
    }
  }

  /**
   * Writes a buffer or string to the binary.
   *
   * @param sequence - a string or buffer to be written to the Binary BSON object.
   * @param offset - specify the binary of where to write the content.
   */
  write(sequence: string | BinarySequence, offset: number): void {
    offset = typeof offset === 'number' ? offset : this.position;

    // If the buffer is to small let's extend the buffer
    if (this.buffer.length < offset + sequence.length) {
      let buffer: Buffer | Uint8Array | null = null;
      // If we are in node.js
      if (isBuffer(this.buffer)) {
        buffer = Buffer.alloc(this.buffer.length + sequence.length);
        this.buffer.copy(buffer, 0, 0, this.buffer.length);
      } else if (isUint8Array(this.buffer)) {
        // Create a new buffer
        buffer = new Uint8Array(new ArrayBuffer(this.buffer.length + sequence.length));
        // Copy the content
        for (let i = 0; i < this.position; i++) {
          buffer[i] = this.buffer[i];
        }
      }

      // Assign the new buffer
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.buffer = buffer!;
    }

    if (isBuffer(sequence) && isBuffer(this.buffer)) {
      sequence.copy(this.buffer, offset, 0, sequence.length);
      this.position =
        offset + sequence.length > this.position ? offset + sequence.length : this.position;
      // offset = string.length
    } else if (typeof sequence === 'string' && isBuffer(this.buffer)) {
      this.buffer.write(sequence, offset, sequence.length, 'binary');
      this.position =
        offset + sequence.length > this.position ? offset + sequence.length : this.position;
      // offset = string.length;
    } else if (
      isUint8Array(sequence) ||
      (Array.isArray(sequence) && typeof sequence !== 'string')
    ) {
      for (let i = 0; i < sequence.length; i++) {
        this.buffer[offset++] = sequence[i];
      }

      this.position = offset > this.position ? offset : this.position;
    } else if (typeof sequence === 'string') {
      for (let i = 0; i < sequence.length; i++) {
        this.buffer[offset++] = sequence.charCodeAt(i);
      }

      this.position = offset > this.position ? offset : this.position;
    }
  }

  /**
   * Reads **length** bytes starting at **position**.
   *
   * @param position - read from the given position in the Binary.
   * @param length - the number of bytes to read.
   */
  read(position: number, length: number): BinarySequence {
    length = length && length > 0 ? length : this.position;

    // Let's return the data based on the type we have
    if (this.buffer['slice']) {
      return this.buffer.slice(position, position + length);
    }

    // Create a buffer to keep the result
    const buffer =
      typeof Uint8Array !== 'undefined'
        ? new Uint8Array(new ArrayBuffer(length))
        : new Array(length);
    for (let i = 0; i < length; i++) {
      buffer[i] = this.buffer[position++];
    }

    // Return the buffer
    return buffer;
  }

  /**
   * Returns the value of this binary as a string.
   * @param asRaw - Will skip converting to a string
   * @remarks
   * This is handy when calling this function conditionally for some key value pairs and not others
   */
  value(asRaw?: boolean): string | BinarySequence {
    asRaw = !!asRaw;

    // Optimize to serialize for the situation where the data == size of buffer
    if (asRaw && isBuffer(this.buffer) && this.buffer.length === this.position) return this.buffer;

    // If it's a node.js buffer object
    if (isBuffer(this.buffer)) {
      return asRaw
        ? this.buffer.slice(0, this.position)
        : this.buffer.toString('binary', 0, this.position);
    } else {
      if (asRaw) {
        // we support the slice command use it
        if (this.buffer['slice'] != null) {
          return this.buffer.slice(0, this.position);
        } else {
          // Create a new buffer to copy content to
          const newBuffer = isUint8Array(this.buffer)
            ? new Uint8Array(new ArrayBuffer(this.position))
            : new Array(this.position);

          // Copy content
          for (let i = 0; i < this.position; i++) {
            newBuffer[i] = this.buffer[i];
          }

          // Return the buffer
          return newBuffer;
        }
      } else {
        return convertArraytoUtf8BinaryString(this.buffer, 0, this.position);
      }
    }
  }

  /** the length of the binary sequence */
  length(): number {
    return this.position;
  }

  /** @internal */
  toJSON(): string {
    if (!this.buffer) return '';
    const buffer = Buffer.from(this.buffer as Uint8Array);
    return buffer.toString('base64');
  }

  /** @internal */
  toString(format: BufferEncoding): string {
    if (!this.buffer) return '';
    const buffer = Buffer.from(this.buffer.slice(0, this.position) as Uint8Array);
    return buffer.toString(format);
  }

  /** @internal */
  toExtendedJSON(options?: EJSONOptions): BinaryExtendedLegacy | BinaryExtended {
    options = options || {};
    const base64String = Buffer.isBuffer(this.buffer)
      ? this.buffer.toString('base64')
      : Buffer.from(this.buffer as Uint8Array).toString('base64');

    const subType = Number(this.sub_type).toString(16);
    if (options.legacy) {
      return {
        $binary: base64String,
        $type: subType.length === 1 ? '0' + subType : subType
      };
    }
    return {
      $binary: {
        base64: base64String,
        subType: subType.length === 1 ? '0' + subType : subType
      }
    };
  }

  /** @internal */
  static fromExtendedJSON(
    doc: BinaryExtendedLegacy | BinaryExtended,
    options?: EJSONOptions
  ): Binary {
    options = options || {};
    let data: Buffer | undefined;
    let type;
    if (options.legacy && typeof doc.$binary === 'string' && '$type' in doc) {
      type = doc.$type ? parseInt(doc.$type, 16) : 0;
      data = Buffer.from(doc.$binary, 'base64');
    } else {
      if (typeof doc.$binary !== 'string') {
        type = doc.$binary.subType ? parseInt(doc.$binary.subType, 16) : 0;
        data = Buffer.from(doc.$binary.base64, 'base64');
      }
    }
    if (!data) {
      throw new TypeError(`Unexpected Binary Extended JSON format ${JSON.stringify(doc)}`);
    }
    return new Binary(data, type);
  }
}

/**
 * Binary default subtype
 * @internal
 */
const BSON_BINARY_SUBTYPE_DEFAULT = 0;

/** @internal */
function writeStringToArray(data: string) {
  // Create a buffer
  const buffer =
    typeof Uint8Array !== 'undefined'
      ? new Uint8Array(new ArrayBuffer(data.length))
      : new Array(data.length);

  // Write the content to the buffer
  for (let i = 0; i < data.length; i++) {
    buffer[i] = data.charCodeAt(i);
  }
  // Write the string to the buffer
  return buffer;
}

/**
 * Convert Array ot Uint8Array to Binary String
 *
 * @internal
 */
function convertArraytoUtf8BinaryString(
  byteArray: number[] | Uint8Array,
  startIndex: number,
  endIndex: number
) {
  let result = '';
  for (let i = startIndex; i < endIndex; i++) {
    result = result + String.fromCharCode(byteArray[i]);
  }

  return result;
}

Object.defineProperty(Binary.prototype, '_bsontype', { value: 'Binary' });
