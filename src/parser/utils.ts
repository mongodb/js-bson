import { Buffer } from 'buffer';
export type BufferEncoding =
  | 'ascii'
  | 'utf8'
  | 'utf16le'
  | 'ucs2'
  | 'base64'
  | 'latin1'
  | 'binary'
  | 'hex';

/**
 * Normalizes our expected stringified form of a function across versions of node
 * @param fn - The function to stringify
 */
export function normalizedFunctionString(fn: Function): string {
  return fn.toString().replace('function(', 'function (');
}

function insecureRandomBytes(size: number): Uint8Array {
  const result = Buffer.alloc(size);
  for (let i = 0; i < size; ++i) result[i] = Math.floor(Math.random() * 256);
  return result;
}

/* We do not want to have to include DOM types just for this check */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let window: any;
declare let require: Function;

export let randomBytes = insecureRandomBytes;
if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
  randomBytes = size => window.crypto.getRandomValues(Buffer.alloc(size));
} else {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    randomBytes = require('crypto').randomBytes;
  } catch (e) {
    // keep the fallback
  }

  // NOTE: in transpiled cases the above require might return null/undefined
  if (randomBytes == null) {
    randomBytes = insecureRandomBytes;
  }
}

export function isUint8Array(value: unknown): value is Uint8Array {
  return Object.prototype.toString.call(value) === '[object Uint8Array]';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const global: any;

/** Call to check if your environment has `Buffer` */
export function haveBuffer(): boolean {
  return typeof global !== 'undefined' && typeof global.Buffer !== 'undefined';
}

// To ensure that 0.4 of node works correctly
export function isDate(d: unknown): d is Date {
  return isObjectLike(d) && Object.prototype.toString.call(d) === '[object Date]';
}

/**
 * @internal
 * this is to solve the `'someKey' in x` problem where x is unknown.
 * https://github.com/typescript-eslint/typescript-eslint/issues/1071#issuecomment-541955753
 */
export function isObjectLike(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === 'object' && candidate !== null;
}
