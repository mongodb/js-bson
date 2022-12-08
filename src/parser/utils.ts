/**
 * Normalizes our expected stringified form of a function across versions of node
 * @param fn - The function to stringify
 */
export function normalizedFunctionString(fn: Function): string {
  return fn.toString().replace('function(', 'function (');
}

export function isAnyArrayBuffer(value: unknown): value is ArrayBuffer {
  return ['[object ArrayBuffer]', '[object SharedArrayBuffer]'].includes(
    Object.prototype.toString.call(value)
  );
}

export function isUint8Array(value: unknown): value is Uint8Array {
  return Object.prototype.toString.call(value) === '[object Uint8Array]';
}

export function isBigInt64Array(value: unknown): value is BigInt64Array {
  return Object.prototype.toString.call(value) === '[object BigInt64Array]';
}

export function isBigUInt64Array(value: unknown): value is BigUint64Array {
  return Object.prototype.toString.call(value) === '[object BigUint64Array]';
}

export function isRegExp(d: unknown): d is RegExp {
  return Object.prototype.toString.call(d) === '[object RegExp]';
}

export function isMap(d: unknown): d is Map<unknown, unknown> {
  return Object.prototype.toString.call(d) === '[object Map]';
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
