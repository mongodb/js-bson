'use strict';

const Buffer = require('buffer').Buffer;
const ensureBuffer = require('../../lib/ensure_buffer');
const expect = require('chai').expect;

describe('ensureBuffer tests', function() {
  it('should be a function', function() {
    expect(ensureBuffer).to.be.a('function');
  });

  it('should return the exact same buffer if a buffer is passed in', function() {
    const bufferIn = Buffer.alloc(10);
    let bufferOut;

    expect(function() {
      bufferOut = ensureBuffer(bufferIn);
    }).to.not.throw(Error);

    expect(bufferOut).to.equal(bufferIn);
  });

  it('should wrap a UInt8Array with a buffer', function() {
    const arrayIn = Uint8Array.from([1, 2, 3]);
    let bufferOut;

    expect(function() {
      bufferOut = ensureBuffer(arrayIn);
    }).to.not.throw(Error);

    expect(bufferOut).to.be.an.instanceOf(Buffer);
    expect(bufferOut.buffer).to.equal(arrayIn.buffer);
  });

  [0, 12, -1, '', 'foo', null, undefined, ['list'], {}, /x/].forEach(function(item) {
    it(`should throw if input is ${typeof item}: ${item}`, function() {
      expect(function() {
        ensureBuffer(item);
      }).to.throw(TypeError);
    });
  });

  [
    /* eslint-disable */
    Int8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array
    /* eslint-enable */
  ].forEach(function(TypedArray) {
    it(`should throw if input is typed array ${TypedArray.name}`, function() {
      const typedArray = new TypedArray();
      expect(function() {
        ensureBuffer(typedArray);
      }).to.throw(TypeError);
    });
  });
});
