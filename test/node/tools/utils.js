/* globals window */
'use strict';
const { types } = require('node:util');

exports.assertArrayEqual = function (array1, array2) {
  if (array1.length !== array2.length) return false;
  for (var i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) return false;
  }

  return true;
};

// String to arraybuffer
exports.stringToArrayBuffer = function (string) {
  var dataBuffer = new Uint8Array(new ArrayBuffer(string.length));
  // Return the strings
  for (var i = 0; i < string.length; i++) {
    dataBuffer[i] = string.charCodeAt(i);
  }
  // Return the data buffer
  return dataBuffer;
};

// String to arraybuffer
exports.stringToArray = function (string) {
  var dataBuffer = new Array(string.length);
  // Return the strings
  for (var i = 0; i < string.length; i++) {
    dataBuffer[i] = string.charCodeAt(i);
  }
  // Return the data buffer
  return dataBuffer;
};

exports.Utf8 = {
  // public method for url encoding
  encode: function (string) {
    string = string.replace(/\r\n/g, '\n');
    var utftext = '';

    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }

    return utftext;
  },

  // public method for url decoding
  decode: function (utftext) {
    var string = '';
    var i = 0;
    var c = 0,
      c2 = 0,
      c3 = 0;

    while (i < utftext.length) {
      c = utftext.charCodeAt(i);
      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      } else if (c > 191 && c < 224) {
        c2 = utftext.charCodeAt(i + 1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = utftext.charCodeAt(i + 1);
        c3 = utftext.charCodeAt(i + 2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }
    }
    return string;
  }
};

exports.assertBuffersEqual = function (done, buffer1, buffer2) {
  if (buffer1.length !== buffer2.length) {
    done('Buffers do not have the same length', buffer1, buffer2);
  }

  for (var i = 0; i < buffer1.length; i++) {
    expect(buffer1[i]).to.equal(buffer2[i]);
  }
};

/**
 * A helper to turn hex string sequences into BSON.
 * Omit the first 8 hex digits for the document it will be calculated
 * As well as the BSON document's null terminator '00'
 *
 * @example
 * ```js
 * const bytes = bufferFromHexArray([
 *   '10', // int32 type
 *   '6100', // 'a' key with key null terminator
 *   '01000000' // little endian int32
 * ])
 * BSON.serialize(bytes) // { a: 1 }
 * ```
 *
 * @param {string[]} array - sequences of hex digits broken up to be human readable
 * @returns
 */
const bufferFromHexArray = array => {
  const string = array.concat(['00']).join('');
  const size = string.length / 2 + 4;

  const byteLength = [size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff]
    .map(n => {
      const hexCode = n.toString(16);
      return hexCode.length === 2 ? hexCode : '0' + hexCode;
    })
    .join('');

  return Buffer.from(byteLength + string, 'hex');
};

exports.bufferFromHexArray = bufferFromHexArray;

/**
 * A helper to calculate the byte size of a string (including null)
 *
 * ```js
 * const x = stringToUTF8HexBytes('ab') // { x: '03000000616200' }
 *
 * @param string - representing what you want to encode into BSON
 * @returns BSON string with byte size encoded
 */
const stringToUTF8HexBytes = str => {
  var b = Buffer.from(str, 'utf8');
  var len = b.byteLength;
  var out = Buffer.alloc(len + 4 + 1);
  out.writeInt32LE(len + 1, 0);
  out.set(b, 4);
  out[len + 1] = 0x00;
  return out.toString('hex');
};

exports.stringToUTF8HexBytes = stringToUTF8HexBytes;

exports.isBrowser = function () {
  // eslint-disable-next-line no-undef
  return typeof window === 'object' && typeof window['navigator'] === 'object';
};

exports.isNode6 = function () {
  // eslint-disable-next-line no-undef
  return process.version.split('.')[0] === 'v6';
};

exports.isBufferOrUint8Array = b => Buffer.isBuffer(b) || types.isUint8Array(b);

const getSymbolFrom = function (target, symbolName, assertExists) {
  if (assertExists == null) assertExists = true;

  const symbol = Object.getOwnPropertySymbols(target).filter(
    s => s.toString() === `Symbol(${symbolName})`
  )[0];

  if (assertExists && !symbol) {
    throw new Error(`Did not find Symbol(${symbolName}) on ${target}`);
  }

  return symbol;
};

exports.getSymbolFrom = getSymbolFrom;
