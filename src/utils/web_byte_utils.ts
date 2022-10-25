import { BSONError } from '../error';
import { isAnyArrayBuffer, isUint8Array } from '../parser/utils';
import type { ByteUtils } from './byte_utils';

type TextDecoder = {
  readonly encoding: string;
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;
  decode(input?: Uint8Array): string;
};
type TextDecoderConstructor = {
  new (label?: string, options?: { fatal?: boolean; ignoreBOM?: boolean }): TextDecoder;
};

type TextEncoder = {
  readonly encoding: string;
  encode(input?: string): Uint8Array;
};
type TextEncoderConstructor = {
  new (): TextEncoder;
};

// Web global
declare const TextDecoder: TextDecoderConstructor;
declare const TextEncoder: TextEncoderConstructor;
declare const atob: (base64: string) => string;
declare const btoa: (binary: string) => string;

export const webByteUtils: ByteUtils = {
  toLocalBufferType(potentialUint8array) {
    if (isUint8Array(potentialUint8array)) {
      return potentialUint8array;
    }

    if (ArrayBuffer.isView(potentialUint8array)) {
      return new Uint8Array(
        potentialUint8array.buffer.slice(
          potentialUint8array.byteOffset,
          potentialUint8array.byteOffset + potentialUint8array.byteLength
        )
      );
    }

    if (isAnyArrayBuffer(potentialUint8array)) {
      return new Uint8Array(potentialUint8array);
    }

    throw new BSONError(`Cannot make a Uint8Array from ${String(potentialUint8array)}`);
  },

  allocate(size) {
    if (typeof size !== 'number') {
      throw new TypeError(`The "size" argument must be of type number. Received ${String(size)}`);
    }
    return new Uint8Array(size);
  },

  equals(a, b) {
    if (a.byteLength !== b.byteLength) {
      return false;
    }
    for (let i = 0; i < a.byteLength; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  },

  fromNumberArray(array) {
    return Uint8Array.from(array);
  },

  fromBase64(base64) {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  },

  toBase64(uint8array) {
    return btoa(webByteUtils.toISO88591(uint8array));
  },

  fromISO88591(codePoints) {
    return Uint8Array.from(codePoints, c => c.charCodeAt(0) & 0xff);
  },

  toHex(uint8array) {
    return Array.from(uint8array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  fromUTF8(text) {
    return new TextEncoder().encode(text);
  },

  toISO88591(uint8array) {
    return Array.from(Uint16Array.from(uint8array), b => String.fromCharCode(b)).join('');
  },

  fromHex(hex) {
    return Uint8Array.from(hex.match(/.{2}/g) ?? [], hexDigits => Number.parseInt(hexDigits, 16));
  },

  toUTF8(uint8array) {
    return new TextDecoder().decode(uint8array);
  },

  utf8ByteLength(input) {
    return webByteUtils.fromUTF8(input).byteLength;
  }
};
