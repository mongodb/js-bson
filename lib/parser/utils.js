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
  randomBytes = size => window.crypto.getRandomValues(new Uint8Array(size));
} else {
  randomBytes = require('crypto').randomBytes;
}

module.exports = {
  normalizedFunctionString,
  randomBytes
};
