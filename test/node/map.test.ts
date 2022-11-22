import { expect } from 'chai';
import * as BSON from '../register-bson';

describe('ES Map support in serialize()', () => {
  it('should serialize a Map to BSON document', () => {
    const map = new Map([['a', new BSON.Int32(2)]]);
    const le12 = new Uint8Array([12, 0, 0, 0]);
    const le2 = new Uint8Array([2, 0, 0, 0]);
    const result = BSON.serialize(map);
    expect(result).to.have.property('byteLength', 12);
    expect(result.subarray(0, 4), 'byteLength must be 12 encoded as Int32LE').to.deep.equal(le12);
    expect(result, 'type indicator must be 0x10 for int32').to.have.property('4', 0x10);
    expect(result, 'key must be utf8 value for `a`').to.have.property('5', 'a'.charCodeAt(0));
    expect(result, '`a` must be followed by null terminator').to.have.property('6', 0x00);
    expect(result.subarray(7, 11), 'int32 value must be encoded in LE').to.deep.equal(le2);
    expect(result, 'all documents end with null terminator').to.have.property('11', 0x00);
  });

  it('should serialize a nested Map to BSON document', () => {
    // { a: { b: 2 } }
    const map = new Map([['a', new Map([['b', new BSON.Int32(2)]])]]);
    const result = BSON.serialize(map);
    const le20 = new Uint8Array([20, 0, 0, 0]);
    const le12 = new Uint8Array([12, 0, 0, 0]);
    const le2 = new Uint8Array([2, 0, 0, 0]);
    expect(result).to.have.property('byteLength', 20);
    expect(result.subarray(0, 4), 'byteLength must be 20 encoded as Int32LE').to.deep.equal(le20);
    expect(result, 'type indicator must be 0x03 for document').to.have.property('4', 0x03);
    expect(result, 'key must be utf8 value for `a`').to.have.property('5', 'a'.charCodeAt(0));
    expect(result, '`a` must be followed by null terminator').to.have.property('6', 0x00);

    // embedded doc
    expect(result.subarray(7, 11), 'byteLength must be 12 encoded as Int32LE').to.deep.equal(le12);
    expect(result, 'type indicator must be 0x10 for int32').to.have.property('11', 0x10);
    expect(result, 'key must be utf8 value for `b`').to.have.property('12', 'b'.charCodeAt(0));
    expect(result, '`b` must be followed by null terminator').to.have.property('13', 0x00);
    expect(result.subarray(14, 18), 'int32 value must be encoded in LE').to.deep.equal(le2);

    expect(result, 'all documents end with null terminator').to.have.property('19', 0x00);
  });

  it('should respect Map element name order when names are numeric', () => {
    const map = new Map([
      ['2', new BSON.Int32(2)],
      ['1', new BSON.Int32(1)]
    ]);

    // demonstrating that keys are not reordered like objects would
    expect(Array.from(map.keys())).to.deep.equal(['2', '1']);
    expect(Object.keys({ [2]: 2, [1]: 1 })).to.deep.equal(['1', '2']);

    const le19 = new Uint8Array([19, 0, 0, 0]);
    const le2 = new Uint8Array([2, 0, 0, 0]);
    const le1 = new Uint8Array([1, 0, 0, 0]);
    const result = BSON.serialize(map);
    expect(result).to.have.property('byteLength', 19);
    expect(result.subarray(0, 4), 'byteLength must be 12 encoded as Int32LE').to.deep.equal(le19);
    expect(result, 'type indicator must be 0x10 for int32').to.have.property('4', 0x10);
    expect(result, 'key must be utf8 value for `2`').to.have.property('5', '2'.charCodeAt(0));
    expect(result, '`2` must be followed by null terminator').to.have.property('6', 0x00);
    expect(result.subarray(7, 11), 'int32 value must be encoded in LE').to.deep.equal(le2);
    expect(result, 'type indicator must be 0x10 for int32').to.have.property('11', 0x10);
    expect(result, 'key must be utf8 value for `1`').to.have.property('12', '1'.charCodeAt(0));
    expect(result, '`1` must be followed by null terminator').to.have.property('13', 0x00);
    expect(result.subarray(14, 18), 'int32 value must be encoded in LE').to.deep.equal(le1);
    expect(result, 'all documents end with null terminator').to.have.property('18', 0x00);
  });
});
