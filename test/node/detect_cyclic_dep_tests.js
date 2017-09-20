'use strict';

var assert = require('assert'),
  createBSON = require('../utils');

exports.setUp = function(callback) {
  callback();
};

exports.tearDown = function(callback) {
  callback();
};

/**
 * @ignore
 */
exports['Should correctly detect cyclic dependency in nested objects'] = function(test) {
  // Force cyclic dependency
  var a = { b: {} };
  a.b.c = a;
  try {
    // Attempt to serialize cyclic dependency
    createBSON().serialize(a);
  } catch (err) {
    assert.equal('cyclic dependency detected', err.message);
  }

  test.done();
};

/**
 * @ignore
 */
exports['Should correctly detect cyclic dependency in deeploy nested objects'] = function(test) {
  // Force cyclic dependency
  var a = { b: { c: [{ d: {} }] } };
  a.b.c[0].d.a = a;

  try {
    // Attempt to serialize cyclic dependency
    createBSON().serialize(a);
  } catch (err) {
    assert.equal('cyclic dependency detected', err.message);
  }

  test.done();
};

/**
 * @ignore
 */
exports['Should correctly detect cyclic dependency in nested array'] = function(test) {
  // Force cyclic dependency
  var a = { b: {} };
  a.b.c = [a];
  try {
    // Attempt to serialize cyclic dependency
    createBSON().serialize(a);
  } catch (err) {
    assert.equal('cyclic dependency detected', err.message);
  }

  test.done();
};
