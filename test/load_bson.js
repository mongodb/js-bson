'use strict';

const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const commonGlobals = {
  TextEncoder,
  TextDecoder,
  btoa,
  atob,
  crypto: {
    getRandomValues(buffer) {
      const random = crypto.randomBytes(buffer.byteLength);
      buffer.set(random, 0);
      return buffer;
    }
  }
};

const rnGlobals = {
  require: require
};

function loadReactNativeCJSModuleBSON(globals) {
  const filename = path.resolve(__dirname, `../lib/bson.rn.cjs`);
  const code = fs.readFileSync(filename, { encoding: 'utf8' });
  const context = vm.createContext({
    exports: Object.create(null),
    ...rnGlobals,
    ...globals
  });

  vm.runInContext(code, context, { filename });
  return { context, exports: context.exports };
}

function loadCJSModuleBSON(globals) {
  const filename = path.resolve(__dirname, `../lib/bson.cjs`);
  const code = fs.readFileSync(filename, { encoding: 'utf8' });
  // These are the only globals BSON strictly depends on
  // an optional global is crypto
  const context = vm.createContext({
    exports: Object.create(null),
    ...commonGlobals,
    // Putting this last to allow caller to override default globals
    ...globals
  });

  vm.runInContext(code, context, { filename });
  return { context, exports: context.exports };
}

async function loadESModuleBSON(globals) {
  const filename = path.resolve(__dirname, `../lib/bson.mjs`);
  const code = await fs.promises.readFile(filename, { encoding: 'utf8' });

  const context = vm.createContext({
    ...commonGlobals,
    // Putting this last to allow caller to override default globals
    ...globals
  });

  const bsonMjs = new vm.SourceTextModule(code, { context });

  await bsonMjs.link(() => {});
  await bsonMjs.evaluate();

  return { context, exports: bsonMjs.namespace };
}

module.exports = {
  loadCJSModuleBSON,
  loadReactNativeCJSModuleBSON,
  loadESModuleBSON
};
