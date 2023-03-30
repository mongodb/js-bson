import { expect } from 'chai';
import { Binary } from '../register-bson';

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
});
