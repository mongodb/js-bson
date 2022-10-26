import { BSONError } from '../error';
import { isAnyArrayBuffer } from '../parser/utils';

type NodeJsEncoding = 'base64' | 'hex' | 'utf8' | 'binary';
type NodeJsBuffer = ArrayBufferView &
  Uint8Array & {
    write(string: string, offset: number, length: undefined, encoding: 'utf8'): number;
    copy(target: Uint8Array, targetStart: number, sourceStart: number, sourceEnd: number): number;
    toString: (this: Uint8Array, encoding: NodeJsEncoding) => string;
    equals: (this: Uint8Array, other: Uint8Array) => boolean;
  };
type NodeJsBufferConstructor = Uint8ArrayConstructor & {
  alloc: (size: number) => NodeJsBuffer;
  from(array: number[]): NodeJsBuffer;
  from(array: Uint8Array): NodeJsBuffer;
  from(array: ArrayBuffer): NodeJsBuffer;
  from(array: ArrayBuffer, byteOffset: number, byteLength: number): NodeJsBuffer;
  from(base64: string, encoding: NodeJsEncoding): NodeJsBuffer;
  byteLength(input: string, encoding: 'utf8'): number;
  isBuffer(value: unknown): value is NodeJsBuffer;
};

// This can be nullish, but we gate the nodejs functions on being exported whether or not this exists
// Node.js global
declare const Buffer: NodeJsBufferConstructor;

function bytesToString(buffer: Uint8Array, encoding: NodeJsEncoding) {
  return nodeJsByteUtils.toLocalBufferType(buffer).toString(encoding);
}

export const nodeJsByteUtils = {
  toLocalBufferType(potentialBuffer: Uint8Array | NodeJsBuffer | ArrayBuffer): NodeJsBuffer {
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

  allocate(size: number) {
    return Buffer.alloc(size);
  },

  equals(a: Uint8Array, b: Uint8Array) {
    return nodeJsByteUtils.toLocalBufferType(a).equals(b);
  },

  fromNumberArray(array: number[]) {
    return Buffer.from(array);
  },

  fromBase64(base64: string) {
    return Buffer.from(base64, 'base64');
  },

  toBase64(buffer: Uint8Array) {
    return bytesToString(buffer, 'base64');
  },

  fromISO88591(codePoints: string) {
    return Buffer.from(codePoints, 'binary');
  },

  toISO88591(buffer: Uint8Array) {
    return bytesToString(buffer, 'binary');
  },

  fromHex(hex: string) {
    return Buffer.from(hex, 'hex');
  },

  toHex(buffer: Uint8Array) {
    return bytesToString(buffer, 'hex');
  },

  fromUTF8(text: string) {
    return Buffer.from(text, 'utf8');
  },

  toUTF8(buffer: Uint8Array) {
    return bytesToString(buffer, 'utf8');
  },

  utf8ByteLength(input: string) {
    return Buffer.byteLength(input, 'utf8');
  },

  encodeUTF8Into(buffer: Uint8Array, source: string, byteOffset: number) {
    return nodeJsByteUtils.toLocalBufferType(buffer).write(source, byteOffset, undefined, 'utf8');
  },

  copy(
    destination: Uint8Array,
    source: Uint8Array,
    destinationBegin: number,
    sourceBegin: number,
    sourceEnd: number
  ) {
    return nodeJsByteUtils
      .toLocalBufferType(source)
      .copy(destination, destinationBegin, sourceBegin, sourceEnd);
  }
};
