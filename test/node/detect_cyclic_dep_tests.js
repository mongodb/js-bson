'use strict';

var createBSON = require('../utils'),
  expect = require('chai').expect;

describe('Cyclic Dependencies', function() {
  /**
   * @ignore
   */
  it('Should correctly detect cyclic dependency in nested objects', function(done) {
    // Force cyclic dependency
    var a = { b: {} };
    a.b.c = a;
    try {
      // Attempt to serialize cyclic dependency
      createBSON().serialize(a);
    } catch (err) {
      expect('cyclic dependency detected').to.equal(err.message);
    }

    done();
  });

  /**
   * @ignore
   */
  it('Should correctly detect cyclic dependency in deeploy nested objects', function(done) {
    // Force cyclic dependency
    var a = { b: { c: [{ d: {} }] } };
    a.b.c[0].d.a = a;

    try {
      // Attempt to serialize cyclic dependency
      createBSON().serialize(a);
    } catch (err) {
      expect('cyclic dependency detected').to.equal(err.message);
    }

    done();
  });

  /**
   * @ignore
   */
  it('Should correctly detect cyclic dependency in nested array', function(done) {
    // Force cyclic dependency
    var a = { b: {} };
    a.b.c = [a];
    try {
      // Attempt to serialize cyclic dependency
      createBSON().serialize(a);
    } catch (err) {
      expect('cyclic dependency detected').to.equal(err.message);
    }

    done();
  });
});
