import { expect } from 'chai';
import { BSON } from '../../src/index';

const FLOAT = new Float64Array(1);
const FLOAT_BYTES = new Uint8Array(FLOAT.buffer, 0, 8);

FLOAT[0] = -1;
// Little endian [0, 0, 0, 0, 0, 0,  240, 191]
// Big endian    [191, 240, 0, 0, 0, 0, 0, 0]
const isBigEndian = FLOAT_BYTES[7] === 0;

describe(`handles big endianness correctly`, () => {
  before(function () {
    if (!isBigEndian) {
      this.skip();
    }
  });

  const bsonWithFloat = Buffer.from(
    [
      '10000000', // 16 bytes in size
      '01', // double
      '6100', // 'a'
      '00'.repeat(6) + 'f0bf', // 8 byte LE float equal to -1
      '00' // doc terminator
    ].join(''),
    'hex'
  );

  it('deserialize should return -1', () => {
    const res = BSON.deserialize(bsonWithFloat);
    expect(res).to.have.property('a', -1);
  });

  it('serialize should set bytes to -1 in little endian format', () => {
    const res = BSON.serialize({ a: new BSON.Double(-1) });
    expect(res).to.deep.equal(bsonWithFloat);
  });
});
