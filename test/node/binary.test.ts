import { expect } from 'chai';
import * as vm from 'node:vm';
import { Binary, BSON } from '../register-bson';

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

  context('inspect()', () => {
    it('when value is default returns "Binary.createFromBase64("", 0)"', () => {
      expect(new Binary().inspect()).to.equal('Binary.createFromBase64("", 0)');
    });

    it('when value is empty returns "Binary.createFromBase64("", 0)"', () => {
      expect(new Binary(new Uint8Array(0)).inspect()).to.equal('Binary.createFromBase64("", 0)');
    });

    it('when value is default with a subtype returns "Binary.createFromBase64("", 35)"', () => {
      expect(new Binary(null, 0x23).inspect()).to.equal('Binary.createFromBase64("", 35)');
    });

    it('when value is empty with a subtype returns "Binary.createFromBase64("", 35)"', () => {
      expect(new Binary(new Uint8Array(0), 0x23).inspect()).to.equal(
        'Binary.createFromBase64("", 35)'
      );
    });

    it('when value has utf8 "abcdef" encoded returns "Binary.createFromBase64("YWJjZGVm", 0)"', () => {
      expect(new Binary(Buffer.from('abcdef', 'utf8')).inspect()).to.equal(
        'Binary.createFromBase64("YWJjZGVm", 0)'
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
});
