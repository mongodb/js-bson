'use strict';

require('source-map-support').install({
  hookRequire: true
});

const { inspect } = require('node:util');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const chai = require('chai');

/**
 * In the runInContext "web" testing instanceof checks fail
 * since the error classes are declared in a different realm (?)
 * So here we augment the chai assertion to fallback on checking the name property of the error instance
 */
chai.use(function (chai) {
  const throwsAssertion = chai.Assertion.prototype.throw;
  chai.Assertion.addMethod('throw', function (...args) {
    try {
      throwsAssertion.call(this, ...args);
    } catch (assertionError) {
      if (assertionError.actual?.name === assertionError.expected) {
        return;
      }
      throw assertionError;
    }
  });
});

// TODO(NODE-4786)
// Register expect globally, this is no longer necessary since we do not use karma / bundle everything together
globalThis.expect = chai.expect;

// Controls whether to run BSON library declaration in an node or "web" environment
const web = process.env.WEB === 'true';
console.error(inspect({ web }, { colors: true }));

// TODO(NODE-4787): Node.js 16 was when the atob and btoa globals were introduced, so we need replacements for testing on 14
const shim_btoa = input => Buffer.prototype.toString.call(Buffer.from(input), 'base64');
const shim_atob = input => Buffer.from(input, 'base64').toString('binary');

let BSON;
if (web) {
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
    atob: typeof atob !== 'undefined' ? atob : shim_atob
  });
  vm.runInContext(code, context, { filename });
  BSON = context.BSON;
} else {
  BSON = require('../src/bson');
}

// Some mocha tests need to know the environment for instanceof assertions or be skipped
BSON.__isWeb__ = web;
module.exports = BSON;
