'use strict';

const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function loadBSONWithGlobal(globals) {
  // TODO(NODE-4787): Node.js 16 was when the atob and btoa globals were introduced, so we need replacements for testing on 14
  const shim_btoa = input => Buffer.prototype.toString.call(Buffer.from(input), 'base64');
  const shim_atob = input => Buffer.from(input, 'base64').toString('binary');
  // TODO(NODE-4713): Using the umd for now since it works well as a Node.js import
  // Switch to the .cjs rollup planned for NODE-4713
  const filename = path.resolve(__dirname, '../dist/bson.browser.umd.js');
  const code = fs.readFileSync(filename, { encoding: 'utf8' });
  // These are the only globals BSON strictly depends on
  // an optional global is crypto
  const context = vm.createContext({
    TextEncoder,
    TextDecoder,
    btoa: typeof btoa !== 'undefined' ? btoa : shim_btoa,
    atob: typeof atob !== 'undefined' ? atob : shim_atob,
    crypto: {
      getRandomValues(buffer) {
        const random = crypto.randomBytes(buffer.byteLength);
        buffer.set(random, 0);
        return buffer;
      }
    },
    // Putting this last to allow caller to override default globals
    ...globals
  });
  vm.runInContext(code, context, { filename });
  return context;
}

module.exports = { loadBSONWithGlobal };
