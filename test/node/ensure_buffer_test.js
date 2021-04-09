/* global SharedArrayBuffer */
'use strict';

const { Buffer } = require('buffer');
const { ensureBuffer } = require('../register-bson');

describe('ensureBuffer tests', function () {
  it('should be a function', function () {
    expect(ensureBuffer).to.be.a('function');
  });

  it('should return the exact same buffer if a buffer is passed in', function () {
    const bufferIn = Buffer.alloc(10);
    let bufferOut;

    expect(function () {
      bufferOut = ensureBuffer(bufferIn);
    }).to.not.throw(Error);

    expect(bufferOut).to.equal(bufferIn);
  });

  it('should wrap a Uint8Array with a buffer', function () {
    const arrayIn = Uint8Array.from([1, 2, 3]);
    let bufferOut;

    expect(function () {
      bufferOut = ensureBuffer(arrayIn);
    }).to.not.throw(Error);

    expect(bufferOut).to.be.an.instanceOf(Buffer);
    expect(bufferOut.buffer).to.equal(arrayIn.buffer);
  });

  it('should wrap a ArrayBuffer with a buffer', function () {
    const arrayBufferIn = Uint8Array.from([1, 2, 3]).buffer;
    let bufferOut;

    expect(function () {
      bufferOut = ensureBuffer(arrayBufferIn);
    }).to.not.throw(Error);

    expect(bufferOut).to.be.an.instanceOf(Buffer);
    expect(bufferOut.buffer).to.equal(arrayBufferIn);
  });

  it('should wrap a SharedArrayBuffer with a buffer', function () {
    if (typeof SharedArrayBuffer === 'undefined') {
      this.skip();
      return;
    }
    const arrayBufferIn = new SharedArrayBuffer(3);
    let bufferOut;

    expect(function () {
      bufferOut = ensureBuffer(arrayBufferIn);
    }).to.not.throw(Error);

    expect(bufferOut).to.be.an.instanceOf(Buffer);
    expect(bufferOut.buffer).to.equal(arrayBufferIn);
  });

  [0, 12, -1, '', 'foo', null, undefined, ['list'], {}, /x/].forEach(function (item) {
    it(`should throw if input is ${typeof item}: ${item}`, function () {
      expect(function () {
        ensureBuffer(item);
      }).to.throw(TypeError);
    });
  });

  [
    Int8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array
  ].forEach(function (TypedArray) {
    it(`should throw if input is typed array ${TypedArray.name}`, function () {
      const typedArray = new TypedArray();
      expect(ensureBuffer(typedArray)).to.be.instanceOf(Buffer);
    });
  });
});
