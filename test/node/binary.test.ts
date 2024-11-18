import { expect } from 'chai';
import * as vm from 'node:vm';
import { __isWeb__, Binary, BSON, BSONError } from '../register-bson';
import * as util from 'node:util';

describe('class Binary', () => {
  context('constructor()', () => {
    it('creates an 256 byte Binary with subtype 0 by default', () => {
      const binary = new Binary();
      expect(binary).to.have.property('buffer');
      expect(binary).to.have.property('position', 0);
      expect(binary).to.have.property('sub_type', 0);
      expect(binary).to.have.nested.property('buffer.byteLength', 256);
      const emptyZeroedArray = new Uint8Array(256);
      emptyZeroedArray.fill(0x00);
      expect(binary.buffer).to.deep.equal(emptyZeroedArray);
    });
  });

  context('createFromHexString()', () => {
    context('when called with a hex sequence', () => {
      it('returns a Binary instance with the decoded bytes', () => {
        const bytes = Buffer.from('abc', 'utf8');
        const binary = Binary.createFromHexString(bytes.toString('hex'));
        expect(binary).to.have.deep.property('buffer', bytes);
        expect(binary).to.have.property('sub_type', 0);
      });

      it('returns a Binary instance with the decoded bytes and subtype', () => {
        const bytes = Buffer.from('abc', 'utf8');
        const binary = Binary.createFromHexString(bytes.toString('hex'), 0x23);
        expect(binary).to.have.deep.property('buffer', bytes);
        expect(binary).to.have.property('sub_type', 0x23);
      });
    });

    context('when called with an empty string', () => {
      it('creates an empty binary', () => {
        const binary = Binary.createFromHexString('');
        expect(binary).to.have.deep.property('buffer', new Uint8Array(0));
        expect(binary).to.have.property('sub_type', 0);
      });

      it('creates an empty binary with subtype', () => {
        const binary = Binary.createFromHexString('', 0x42);
        expect(binary).to.have.deep.property('buffer', new Uint8Array(0));
        expect(binary).to.have.property('sub_type', 0x42);
      });
    });
  });

  context('createFromBase64()', () => {
    context('when called with a base64 sequence', () => {
      it('returns a Binary instance with the decoded bytes', () => {
        const bytes = Buffer.from('abc', 'utf8');
        const binary = Binary.createFromBase64(bytes.toString('base64'));
        expect(binary).to.have.deep.property('buffer', bytes);
        expect(binary).to.have.property('sub_type', 0);
      });

      it('returns a Binary instance with the decoded bytes and subtype', () => {
        const bytes = Buffer.from('abc', 'utf8');
        const binary = Binary.createFromBase64(bytes.toString('base64'), 0x23);
        expect(binary).to.have.deep.property('buffer', bytes);
        expect(binary).to.have.property('sub_type', 0x23);
      });
    });

    context('when called with an empty string', () => {
      it('creates an empty binary', () => {
        const binary = Binary.createFromBase64('');
        expect(binary).to.have.deep.property('buffer', new Uint8Array(0));
        expect(binary).to.have.property('sub_type', 0);
      });

      it('creates an empty binary with subtype', () => {
        const binary = Binary.createFromBase64('', 0x42);
        expect(binary).to.have.deep.property('buffer', new Uint8Array(0));
        expect(binary).to.have.property('sub_type', 0x42);
      });
    });
  });

  describe('read()', function () {
    const LocalBuffer = __isWeb__ ? Uint8Array : Buffer;

    it('reads a single byte from the buffer', function () {
      const binary = new Binary();
      binary.put(0x42);
      expect(binary.read(0, 1)).to.deep.equal(LocalBuffer.of(0x42));
    });

    it('does not read beyond binary.position', function () {
      const binary = new Binary();
      binary.put(0x42);
      expect(binary.buffer.byteLength).to.equal(256);
      expect(binary.read(0, 10)).to.deep.equal(LocalBuffer.of(0x42));
    });

    it('reads a single byte from the buffer at the given position', function () {
      const binary = new Binary();
      binary.put(0x42);
      binary.put(0x43);
      binary.put(0x44);
      expect(binary.read(1, 1)).to.deep.equal(LocalBuffer.of(0x43));
    });

    it('reads nothing if the position is out of bounds', function () {
      const binary = new Binary();
      expect(binary.read(1, 0)).to.have.lengthOf(0);
    });

    it('sets length to position if not provided', function () {
      const binary = new Binary();
      binary.put(0x42);
      binary.put(0x42);
      binary.put(0x42);
      expect(binary.position).to.equal(3);
      // @ts-expect-error: checking behavior TS doesn't support
      expect(binary.read(0)).to.have.lengthOf(3);
    });
  });

  context('inspect()', () => {
    it(`when value is default returns "Binary.createFromBase64('', 0)"`, () => {
      expect(util.inspect(new Binary())).to.equal(`Binary.createFromBase64('', 0)`);
    });

    it(`when value is empty returns "Binary.createFromBase64('', 0)"`, () => {
      expect(util.inspect(new Binary(new Uint8Array(0)))).to.equal(
        `Binary.createFromBase64('', 0)`
      );
    });

    it(`when value is default with a subtype returns "Binary.createFromBase64('', 35)"`, () => {
      // @ts-expect-error: check null is handled the same as undefined
      expect(util.inspect(new Binary(null, 0x23))).to.equal(`Binary.createFromBase64('', 35)`);
    });

    it(`when value is empty with a subtype returns "Binary.createFromBase64('', 35)"`, () => {
      expect(util.inspect(new Binary(new Uint8Array(0), 0x23))).to.equal(
        `Binary.createFromBase64('', 35)`
      );
    });

    it(`when value has utf8 "abcdef" encoded returns "Binary.createFromBase64("YWJjZGVm", 0)"`, () => {
      expect(util.inspect(new Binary(Buffer.from('abcdef', 'utf8')))).to.equal(
        `Binary.createFromBase64('YWJjZGVm', 0)`
      );
    });

    context('when result is executed', () => {
      it('has a position of zero when constructed with default space', () => {
        const bsonValue = new Binary();
        const ctx = { ...BSON, module: { exports: { result: null } } };
        vm.runInNewContext(`module.exports.result = ${bsonValue.inspect()}`, ctx);
        expect(ctx.module.exports.result).to.have.property('position', 0);
        expect(ctx.module.exports.result).to.have.property('sub_type', 0);

        // While the default Binary has 256 bytes the newly constructed one will have 0
        // both will have a position of zero so when serialized to BSON they are the equivalent.
        expect(ctx.module.exports.result).to.have.nested.property('buffer.byteLength', 0);
        expect(bsonValue).to.have.nested.property('buffer.byteLength', 256);
      });

      it('is deep equal with a Binary that has no data', () => {
        const bsonValue = new Binary(new Uint8Array(0));
        const ctx = { ...BSON, module: { exports: { result: null } } };
        vm.runInNewContext(`module.exports.result = ${bsonValue.inspect()}`, ctx);
        expect(ctx.module.exports.result).to.deep.equal(bsonValue);
      });

      it('is deep equal with a Binary that has a subtype but no data', () => {
        const bsonValue = new Binary(new Uint8Array(0), 0x23);
        const ctx = { ...BSON, module: { exports: { result: null } } };
        vm.runInNewContext(`module.exports.result = ${bsonValue.inspect()}`, ctx);
        expect(ctx.module.exports.result).to.deep.equal(bsonValue);
      });

      it('is deep equal with a Binary that has data', () => {
        const bsonValue = new Binary(Buffer.from('abc', 'utf8'));
        const ctx = { ...BSON, module: { exports: { result: null } } };
        vm.runInNewContext(`module.exports.result = ${bsonValue.inspect()}`, ctx);
        expect(ctx.module.exports.result).to.deep.equal(bsonValue);
      });
    });
  });

  context('toString()', () => {
    context('when case is UTF8 (default)', () => {
      it('should respect position when converting to string', () => {
        const bin = new Binary();
        expect(bin.toString()).to.equal('');
        bin.put(1);
        expect(bin.toString()).to.equal('\u0001');
      });
      it('should remain same after round trip', () => {
        const bin = new BSON.Binary();
        const serializedBin = BSON.serialize({ bin });
        const roundTrippedBin = BSON.deserialize(serializedBin);
        expect(roundTrippedBin.bin.toString()).to.equal(bin.toString());
      });
    });

    context('when case is hex', () => {
      it('should respect position when converting to string', () => {
        const bin = new Binary();
        expect(bin.toString('hex')).to.equal('');
        bin.put(1);
        expect(bin.toString('hex')).to.equal('01');
      });
      it('should remain same after round trip', () => {
        const bin = new BSON.Binary();
        const serializedBin = BSON.serialize({ bin });
        const roundTrippedBin = BSON.deserialize(serializedBin);
        expect(roundTrippedBin.bin.toString('hex')).to.equal(bin.toString('hex'));
      });
    });

    context('when case is base64', () => {
      it('should respect position when converting to string', () => {
        const bin = new Binary();
        expect(bin.toString('base64')).to.equal('');
        bin.put(1);
        expect(bin.toString('base64')).to.equal('AQ==');
      });
      it('should remain same after round trip', () => {
        const bin = new BSON.Binary();
        const serializedBin = BSON.serialize({ bin });
        const roundTrippedBin = BSON.deserialize(serializedBin);
        expect(roundTrippedBin.bin.toString('base64')).to.equal(bin.toString());
      });
    });
  });

  context('toJSON()', () => {
    it('should respect position when converting to JSON', () => {
      const bin = new Binary();
      expect(bin.toJSON()).to.equal('');
      bin.put(1);
      // toJSON uses base64
      expect(bin.toJSON()).to.equal('AQ==');
    });

    it('should remain same after round trip', () => {
      const bin = new BSON.Binary();
      const serializedBin = BSON.serialize({ bin });
      const roundTrippedBin = BSON.deserialize(serializedBin);
      expect(roundTrippedBin.bin.toJSON()).to.equal(bin.toJSON());
    });
  });

  describe('sub_type vector', () => {
    describe('datatype constants', () => {
      it('has Int8, Float32 and PackedBit', () => {
        expect(Binary.VECTOR_TYPE).to.have.property('Int8', 0x03);
        expect(Binary.VECTOR_TYPE).to.have.property('Float32', 0x27);
        expect(Binary.VECTOR_TYPE).to.have.property('PackedBit', 0x10);
      });
    });

    describe('toInt8Array()', () => {
      it('returns a copy of the bytes', function () {
        const binary = Binary.fromInt8Array(new Int8Array([1, 2, 3]));
        expect(binary.toInt8Array().buffer).to.not.equal(binary.buffer.buffer);
      });

      it('returns at the correct offset when ArrayBuffer is much larger than content', function () {
        const space = new ArrayBuffer(400);
        const view = new Uint8Array(space, 56, 4); // random view in a much larger buffer
        const binary = new Binary(view, 9);
        binary.buffer[0] = Binary.VECTOR_TYPE.Int8;
        binary.buffer[1] = 0;
        binary.buffer[2] = 255;
        binary.buffer[3] = 255;
        expect(binary.toInt8Array()).to.deep.equal(new Int8Array([-1, -1]));
      });

      it('returns Int8Array when sub_type is vector and datatype is INT8', () => {
        const int8Array = new Int8Array([1, 2, 3]);
        const binary = Binary.fromInt8Array(int8Array);
        expect(binary.toInt8Array()).to.deep.equal(int8Array);
      });

      it('throws error when sub_type is not vector', () => {
        const binary = new Binary(new Uint8Array([1, 2, 3]), Binary.SUBTYPE_BYTE_ARRAY);
        expect(() => binary.toInt8Array()).to.throw(BSONError, 'Binary sub_type is not Vector');
      });

      it('throws error when datatype is not INT8', () => {
        const binary = new Binary(
          new Uint8Array([Binary.VECTOR_TYPE.Float32, 0, 1, 2, 3]),
          Binary.SUBTYPE_VECTOR
        );
        expect(() => binary.toInt8Array()).to.throw(BSONError, 'Binary datatype field is not Int8');
      });
    });

    describe('toFloat32Array()', () => {
      it('returns a copy of the bytes', function () {
        const binary = Binary.fromFloat32Array(new Float32Array([1.1, 2.2, 3.3]));
        expect(binary.toFloat32Array().buffer).to.not.equal(binary.buffer.buffer);
      });

      it('returns at the correct offset when ArrayBuffer is much larger than content', function () {
        const space = new ArrayBuffer(400);
        const view = new Uint8Array(space, 56, 6); // random view in a much larger buffer
        const binary = new Binary(view, 9);
        binary.buffer[0] = Binary.VECTOR_TYPE.Float32;
        binary.buffer[1] = 0;
        // For reference:
        // [ 0, 0, 128, 191 ] is -1 in little endian
        binary.buffer[2] = 0;
        binary.buffer[3] = 0;
        binary.buffer[4] = 128;
        binary.buffer[5] = 191;
        expect(binary.toFloat32Array()).to.deep.equal(new Float32Array([-1]));
      });

      it('returns Float32Array when sub_type is vector and datatype is FLOAT32', () => {
        const float32Array = new Float32Array([1.1, 2.2, 3.3]);
        const binary = Binary.fromFloat32Array(float32Array);
        expect(binary.toFloat32Array()).to.deep.equal(float32Array);
      });

      it('throws error when sub_type is not vector', () => {
        const binary = new Binary(new Uint8Array([1, 2, 3]), Binary.SUBTYPE_BYTE_ARRAY);
        expect(() => binary.toFloat32Array()).to.throw(BSONError, 'Binary sub_type is not Vector');
      });

      it('throws error when datatype is not FLOAT32', () => {
        const binary = new Binary(
          new Uint8Array([Binary.VECTOR_TYPE.Int8, 0, 1, 2, 3]),
          Binary.SUBTYPE_VECTOR
        );
        expect(() => binary.toFloat32Array()).to.throw(
          BSONError,
          'Binary datatype field is not Float32'
        );
      });

      it('transforms endianness correctly', () => {
        // The expectation is that this test is run on LE and BE machines to
        // demonstrate that on BE machines we get the same result
        const float32Vector = new Uint8Array([
          ...[Binary.VECTOR_TYPE.Float32, 0], // datatype, padding
          ...[0, 0, 128, 191], // -1
          ...[0, 0, 128, 191] // -1
        ]);
        const binary = new Binary(float32Vector, Binary.SUBTYPE_VECTOR);

        // For reference:
        // [ 0, 0, 128, 191 ] is -1 in little endian
        // [ 191, 128, 0, 0 ] is -1 in big endian
        // REGARDLESS of platform, BSON is ALWAYS little endian
        expect(binary.toFloat32Array()).to.deep.equal(new Float32Array([-1, -1]));
      });
    });

    describe('toBits()', () => {
      it('returns Int8Array of bits when sub_type is vector and datatype is PACKED_BIT', () => {
        const bits = new Int8Array([1, 0, 1, 1, 0, 0, 1, 0]);
        const binary = Binary.fromBits(bits);
        expect(binary.toBits()).to.deep.equal(bits);
      });

      it('returns at the correct offset when ArrayBuffer is much larger than content', function () {
        const space = new ArrayBuffer(400);
        const view = new Uint8Array(space, 56, 3); // random view in a much larger buffer
        const binary = new Binary(view, 9);
        binary.buffer[0] = Binary.VECTOR_TYPE.PackedBit;
        binary.buffer[1] = 4;
        binary.buffer[2] = 0xf0;
        expect(binary.toBits()).to.deep.equal(new Int8Array([1, 1, 1, 1]));
      });

      it('throws error when sub_type is not vector', () => {
        const binary = new Binary(new Uint8Array([1, 2, 3]), Binary.SUBTYPE_BYTE_ARRAY);
        expect(() => binary.toBits()).to.throw(BSONError, 'Binary sub_type is not Vector');
      });

      it('throws error when datatype is not PACKED_BIT', () => {
        const binary = new Binary(
          new Uint8Array([Binary.VECTOR_TYPE.Int8, 0, 1, 2, 3]),
          Binary.SUBTYPE_VECTOR
        );
        expect(() => binary.toBits()).to.throw(
          BSONError,
          'Binary datatype field is not packed bit'
        );
      });
    });

    describe('toPackedBits()', () => {
      it('returns Uint8Array of packed bits when sub_type is vector and datatype is PACKED_BIT', () => {
        const bits = new Uint8Array([127, 8]);
        const binary = Binary.fromPackedBits(bits, 3);
        expect(binary.toPackedBits()).to.deep.equal(bits);
        expect(binary.toBits()).to.deep.equal(
          new Int8Array([0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1])
        );
      });

      it('returns at the correct offset when ArrayBuffer is much larger than content', function () {
        const space = new ArrayBuffer(400);
        const view = new Uint8Array(space, 56, 3); // random view in a much larger buffer
        const binary = new Binary(view, 9);
        binary.buffer[0] = Binary.VECTOR_TYPE.PackedBit;
        binary.buffer[1] = 4;
        binary.buffer[2] = 0xf0;
        expect(binary.toPackedBits()).to.deep.equal(new Uint8Array([0xf0]));
      });

      it('throws error when sub_type is not vector', () => {
        const binary = new Binary(new Uint8Array([1, 2, 3]), Binary.SUBTYPE_BYTE_ARRAY);
        expect(() => binary.toPackedBits()).to.throw(BSONError, 'Binary sub_type is not Vector');
      });

      it('throws error when datatype is not PACKED_BIT', () => {
        const binary = new Binary(
          new Uint8Array([Binary.VECTOR_TYPE.Int8, 0, 1, 2, 3]),
          Binary.SUBTYPE_VECTOR
        );
        expect(() => binary.toPackedBits()).to.throw(
          BSONError,
          'Binary datatype field is not packed bit'
        );
      });
    });

    describe('fromInt8Array()', () => {
      it('creates Binary instance from Int8Array', () => {
        const int8Array = new Int8Array([1, 2, 3]);
        const binary = Binary.fromInt8Array(int8Array);
        expect(binary.buffer[0]).to.equal(Binary.VECTOR_TYPE.Int8);
        expect(binary.toInt8Array()).to.deep.equal(int8Array);
      });

      it('creates empty Binary instance when Int8Array is empty', () => {
        const binary = Binary.fromInt8Array(new Int8Array(0));
        expect(binary.buffer[0]).to.equal(Binary.VECTOR_TYPE.Int8);
        expect(binary.buffer[1]).to.equal(0);
        expect(binary.toInt8Array()).to.deep.equal(new Int8Array(0));
      });
    });

    describe('fromFloat32Array()', () => {
      it('creates Binary instance from Float32Array', () => {
        const float32Array = new Float32Array([1.1, 2.2, 3.3]);
        const binary = Binary.fromFloat32Array(float32Array);
        expect(binary.buffer[0]).to.equal(Binary.VECTOR_TYPE.Float32);
        expect(binary.toFloat32Array()).to.deep.equal(float32Array);
      });

      it('creates empty Binary instance when Float32Array is empty', () => {
        const binary = Binary.fromFloat32Array(new Float32Array(0));
        expect(binary.buffer[0]).to.equal(Binary.VECTOR_TYPE.Float32);
        expect(binary.buffer[1]).to.equal(0);
        expect(binary.toFloat32Array()).to.deep.equal(new Float32Array(0));
      });

      it('transforms endianness correctly', () => {
        // The expectation is that this test is run on LE and BE machines to
        // demonstrate that on BE machines we get the same result
        const float32Array = new Float32Array([-1, -1]);
        const binary = Binary.fromFloat32Array(float32Array);
        expect(binary.buffer[0]).to.equal(Binary.VECTOR_TYPE.Float32);
        expect(binary.buffer[1]).to.equal(0);

        // For reference:
        // [ 0, 0, 128, 191 ] is -1 in little endian
        // [ 191, 128, 0, 0 ] is -1 in big endian
        // REGARDLESS of platform, BSON is ALWAYS little endian
        expect(Array.from(binary.buffer.subarray(2))).to.deep.equal([
          ...[0, 0, 128, 191], // -1
          ...[0, 0, 128, 191] // -1
        ]);
      });
    });

    describe('fromPackedBits()', () => {
      it('creates Binary instance from packed bits', () => {
        const bits = new Uint8Array([127, 8]);
        const binary = Binary.fromPackedBits(bits, 3);
        expect(binary.buffer[0]).to.equal(Binary.VECTOR_TYPE.PackedBit);
        expect(binary.buffer[1]).to.equal(3);
        expect(binary.buffer.subarray(2)).to.deep.equal(bits);
      });

      it('creates empty Binary instance when bits are empty', () => {
        const binary = Binary.fromBits(new Int8Array(0));
        expect(binary.buffer[0]).to.equal(Binary.VECTOR_TYPE.PackedBit);
        expect(binary.buffer[1]).to.equal(0);
        expect(binary.toBits()).to.deep.equal(new Int8Array(0));
      });
    });

    describe('fromBits()', () => {
      it('creates Binary instance from bits', () => {
        const bits = new Int8Array([1, 0, 1, 1, 0, 0, 1, 0]);
        const binary = Binary.fromBits(bits);
        expect(binary.buffer[0]).to.equal(Binary.VECTOR_TYPE.PackedBit);
        expect(binary.toBits()).to.deep.equal(bits);
      });

      it('creates empty Binary instance when bits are empty', () => {
        const binary = Binary.fromBits(new Int8Array(0));
        expect(binary.buffer[0]).to.equal(Binary.VECTOR_TYPE.PackedBit);
        expect(binary.buffer[1]).to.equal(0);
        expect(binary.toBits()).to.deep.equal(new Int8Array(0));
      });

      it('throws when values are not 1 or 0', () => {
        expect(() => Binary.fromBits([1, 0, 2])).to.throw(BSONError, /must be 0 or 1/);
      });
    });
  });
});
