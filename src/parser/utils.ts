/* global window */

/**
 * Normalizes our expected stringified form of a function across versions of node
 * @param {Function} fn The function to stringify
 */
export function normalizedFunctionString(fn: Function): string {
  const fnStr = fn.toString();
  const updateFnStr = fnStr.replace('function(', 'function (');
  return updateFnStr;
}

function insecureRandomBytes(size) {
  const result = new Uint8Array(size);
  for (let i = 0; i < size; ++i) result[i] = Math.floor(Math.random() * 256);
  return result;
}

declare let window: any;

export let randomBytes = insecureRandomBytes;
if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
  randomBytes = size => window.crypto.getRandomValues(new Uint8Array(size));
} else {
  try {
    randomBytes = require('crypto').randomBytes;
  } catch (e) {
    // keep the fallback
  }

  // NOTE: in transpiled cases the above require might return null/undefined
  if (randomBytes == null) {
    randomBytes = insecureRandomBytes;
  }
}
