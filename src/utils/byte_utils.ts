import { nodeJsByteUtils } from './node_byte_utils';
import { webByteUtils } from './web_byte_utils';

export type ByteUtils = {
  /** Transforms the input to an instance of Buffer if running on node, otherwise Uint8Array */
  toLocalBufferType: (buffer: Uint8Array) => Uint8Array;
  /** Create empty space of size */
  allocate: (size: number) => Uint8Array;
  /** Check if two Uint8Arrays are deep equal */
  equals: (a: Uint8Array, b: Uint8Array) => boolean;
  /** Check if two Uint8Arrays are deep equal */
  fromNumberArray: (array: number[]) => Uint8Array;
  /** Create a Uint8Array from a base64 string */
  fromBase64: (base64: string) => Uint8Array;
  /** Create a base64 string from bytes */
  toBase64: (buffer: Uint8Array) => string;
  /** Create a Uint8Array from a hex string */
  fromHex: (hex: string) => Uint8Array;
  /** Create a hex string from bytes */
  toHex: (buffer: Uint8Array) => string;
  /** @deprecated binary strings are a legacy method of data transfer */
  fromISO88591: (codePoints: string) => Uint8Array;
  /** @deprecated binary strings are a legacy method of data transfer */
  toISO88591: (buffer: Uint8Array) => string;
  /** Create a Uint8Array containing utf8 code units from a string */
  fromText: (text: string) => Uint8Array;
  /** Create a string from utf8 code units */
  toText: (buffer: Uint8Array) => string;
  /** Get the utf8 code unit count from a string if it were to be transformed to utf8 */
  utf8ByteLength: (input: string) => number;
};

declare const Buffer: unknown;
/**
 * Check that a global Buffer exists that is a function and
 * does not have a '_isBuffer' property defined on the prototype
 * (this is to prevent using the npm buffer)
 */
const hasGlobalBuffer = typeof Buffer === 'function' && Buffer.prototype._isBuffer !== true;

export const ByteUtils: ByteUtils = hasGlobalBuffer ? nodeJsByteUtils : webByteUtils;

export class BSONDataView extends DataView {
  static fromUint8Array(input: Uint8Array) {
    return new DataView(input.buffer, input.byteOffset, input.byteLength);
  }
}
