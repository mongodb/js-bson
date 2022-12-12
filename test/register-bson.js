'use strict';

require('source-map-support').install({
  hookRequire: true
});

const { inspect } = require('node:util');
const chai = require('chai');
chai.use(require('sinon-chai'));
chai.config.truncateThreshold = 0;

const { loadBSONWithGlobal } = require('./load_bson');

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

let BSON;
if (web) {
  BSON = loadBSONWithGlobal().exports;
} else {
  BSON = require('../src/index');
}

// Some mocha tests need to know the environment for instanceof assertions or be skipped
BSON.__isWeb__ = web;
module.exports = BSON;
