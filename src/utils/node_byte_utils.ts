import { BSONError } from '../error';
import { isAnyArrayBuffer } from '../parser/utils';
import type { ByteUtils } from './byte_utils';

type NodeJsEncoding = 'base64' | 'hex' | 'utf8' | 'binary';
type NodeJsBuffer = {
  alloc: (size: number) => Uint8Array;
  from(array: number[]): Uint8Array;
  from(array: Uint8Array): Uint8Array;
  from(array: ArrayBuffer): Uint8Array;
  from(array: ArrayBuffer, byteOffset: number, byteLength: number): Uint8Array;
  from(base64: string, encoding: NodeJsEncoding): Uint8Array;
  byteLength(input: string, encoding: 'utf8'): number;
  isBuffer(value: unknown): value is Uint8Array;
  prototype: {
    toString: (this: Uint8Array, encoding: NodeJsEncoding) => string;
    equals: (this: Uint8Array, other: Uint8Array) => boolean;
  };
};

// This can be nullish, but we gate the nodejs functions on being exported whether or not this exists
// Node.js global
declare const Buffer: NodeJsBuffer;

function bytesToString(buffer: Uint8Array, encoding: NodeJsEncoding) {
  // @ts-expect-error: toLocalBufferType returns a Node.js Buffer
  return nodeJsByteUtils.toLocalBufferType(buffer).toString(encoding);
}

export const nodeJsByteUtils: ByteUtils = {
  toLocalBufferType(potentialBuffer) {
    if (Buffer.isBuffer(potentialBuffer)) {
      return potentialBuffer;
    }

    if (ArrayBuffer.isView(potentialBuffer)) {
      return Buffer.from(
        potentialBuffer.buffer,
        potentialBuffer.byteOffset,
        potentialBuffer.byteLength
      );
    }

    if (isAnyArrayBuffer(potentialBuffer)) {
      return Buffer.from(potentialBuffer);
    }

    throw new BSONError(`Cannot create Buffer from ${String(potentialBuffer)}`);
  },

  allocate(size) {
    return Buffer.alloc(size);
  },

  equals(a, b) {
    return Buffer.prototype.equals.call(a, b);
  },

  fromNumberArray(array) {
    return Buffer.from(array);
  },

  fromBase64(base64) {
    return Buffer.from(base64, 'base64');
  },

  toBase64(buffer) {
    return bytesToString(buffer, 'base64');
  },

  fromISO88591(codePoints) {
    return Buffer.from(codePoints, 'binary');
  },

  toISO88591(buffer) {
    return bytesToString(buffer, 'binary');
  },

  fromHex(hex) {
    return Buffer.from(hex, 'hex');
  },

  toHex(buffer) {
    return bytesToString(buffer, 'hex');
  },

  fromUTF8(text) {
    return Buffer.from(text, 'utf8');
  },

  toUTF8(buffer) {
    return bytesToString(buffer, 'utf8');
  },

  utf8ByteLength(input) {
    return Buffer.byteLength(input, 'utf8');
  }
};
