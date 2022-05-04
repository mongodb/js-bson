/* global SharedArrayBuffer */
'use strict';

const { Buffer } = require('buffer');
const { ensureBuffer } = require('../register-bson');
const BSON = require('../register-bson');
const BSONTypeError = BSON.BSONTypeError;

describe('ensureBuffer tests', function () {
  it('should be a function', function () {
    expect(ensureBuffer).to.be.a('function');
  });

  it('should return a view over the exact same memory when a Buffer is passed in', function () {
    const bufferIn = Buffer.alloc(10);
    let bufferOut;

    expect(function () {
      bufferOut = ensureBuffer(bufferIn);
    }).to.not.throw(BSONTypeError);

    expect(bufferOut).to.be.an.instanceOf(Buffer);
    expect(bufferOut.buffer).to.equal(bufferIn.buffer);
    expect(bufferOut.byteLength).to.equal(bufferIn.byteLength);
    expect(bufferOut.byteOffset).to.equal(bufferIn.byteOffset);
  });

  it('should wrap a Uint8Array with a buffer', function () {
    const arrayIn = Uint8Array.from([1, 2, 3]);
    let bufferOut;

    expect(function () {
      bufferOut = ensureBuffer(arrayIn);
    }).to.not.throw(BSONTypeError);

    expect(bufferOut).to.be.an.instanceOf(Buffer);
    expect(bufferOut.buffer).to.equal(arrayIn.buffer);
  });

  it('should wrap a ArrayBuffer with a buffer', function () {
    const arrayBufferIn = Uint8Array.from([1, 2, 3]).buffer;
    let bufferOut;

    expect(function () {
      bufferOut = ensureBuffer(arrayBufferIn);
    }).to.not.throw(BSONTypeError);

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
    }).to.not.throw(BSONTypeError);

    expect(bufferOut).to.be.an.instanceOf(Buffer);
    expect(bufferOut.buffer).to.equal(arrayBufferIn);
  });

  it('should account for the input view byteLength and byteOffset', function () {
    const input = new Uint8Array(new Uint8Array([1, 2, 3, 4, 5]).buffer, 1, 3);
    let bufferOut;

    expect(function () {
      bufferOut = ensureBuffer(input);
    }).to.not.throw(BSONTypeError);

    expect(bufferOut).to.be.an.instanceOf(Buffer);
    expect(bufferOut.byteLength).to.equal(3);
    expect(bufferOut.byteOffset).to.equal(1);
  });

  [0, 12, -1, '', 'foo', null, undefined, ['list'], {}, /x/].forEach(function (item) {
    it(`should throw if input is ${typeof item}: ${item}`, function () {
      expect(function () {
        ensureBuffer(item);
      }).to.throw(BSONTypeError);
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
