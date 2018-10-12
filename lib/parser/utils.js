'use strict';

/* global window */

/**
 * Normalizes our expected stringified form of a function across versions of node
 * @param {Function} fn The function to stringify
 */
function normalizedFunctionString(fn) {
  return fn.toString().replace('function(', 'function (');
}

let randomBytes;
if (typeof window !== 'undefined') {
  if (window.crypto && window.crypto.getRandomValues) {
    randomBytes = size => window.crypto.getRandomValues(new Uint8Array(size));
  } else {
    randomBytes = size => {
      const result = new Uint8Array(size);
      for (let i = 0; i < size; ++i) result[i] = Math.floor(Math.random() * 256);
      return result;
    };
  }
} else {
  randomBytes = require('crypto').randomBytes;
}

module.exports = {
  normalizedFunctionString,
  randomBytes
};
