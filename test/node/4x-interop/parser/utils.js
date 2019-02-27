'use strict';

/* global window */

/**
 * @ignore
 */
function normalizedFunctionString(fn) {
  return fn.toString().replace('function(', 'function (');
}

function insecureRandomBytes(size) {
  var result = new Uint8Array(size);
  for (var i = 0; i < size; ++i) result[i] = Math.floor(Math.random() * 256);
  return result;
}

var randomBytes = insecureRandomBytes;
if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
  randomBytes = function(size) {return window.crypto.getRandomValues(new Uint8Array(size));}
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

module.exports = {
  normalizedFunctionString: normalizedFunctionString,
  randomBytes: randomBytes
};
