import { expect } from 'chai';
import * as BSON from '../register-bson';
import { bufferFromHexArray } from './tools/utils';

describe('ES Map support in serialize()', () => {
  it('serialize a empty Map to BSON document - { }', () => {
    const map = new Map();
    const emptyBSON = bufferFromHexArray(['']);
    const result = BSON.serialize(map);
    expect(result).to.have.property('byteLength', 5);
    expect(result, 'byteLength must be 5 followed by null terminator').to.deep.equal(emptyBSON);
  });

  it('serialize a Map with one key to BSON document - { a: 2 }', () => {
    const map = new Map([['a', new BSON.Int32(2)]]);
    const expected = bufferFromHexArray([
      '10', // int32 type
      '6100', // 'a' & null
      '02000000' // LE 32bit 2
    ]);
    const result = BSON.serialize(map);
    expect(result).to.have.property('byteLength', 12);
    expect(result).to.deep.equal(expected);
  });

  it('serialize a nested Map to a BSON document - { a: { b: 2 } }', () => {
    // { a: { b: 2 } }
    const map = new Map([['a', new Map([['b', new BSON.Int32(2)]])]]);
    const expected = bufferFromHexArray([
      '03', // doc type
      '6100', // 'a' & null
      // nested document
      bufferFromHexArray([
        '10', // int32 type
        '6200', // 'b' & null
        '02000000' // LE 32bit 2
      ]).toString('hex')
    ]);
    const result = BSON.serialize(map);
    expect(result).to.have.property('byteLength', 20);
    expect(result).to.deep.equal(expected);
  });

  it('keep chronological Map key order despite keys being numeric', () => {
    const map = new Map([
      ['2', new BSON.Int32(2)],
      ['1', new BSON.Int32(1)]
    ]);

    // meta assertions: demonstrating that keys are not reordered like objects would
    expect(Array.from(map.keys())).to.deep.equal(['2', '1']);
    expect(Object.keys({ [2]: 2, [1]: 1 })).to.deep.equal(['1', '2']);

    const expected = bufferFromHexArray([
      '10', // int32 type
      '3200', // '2' & null
      '02000000', // LE 32bit 2
      '10', // int32 type
      '3100', // '1' & null
      '01000000' // LE 32bit 1
    ]);
    const result = BSON.serialize(map);
    expect(result).to.have.property('byteLength', 19);
    expect(result).to.deep.equal(expected);
  });
});
