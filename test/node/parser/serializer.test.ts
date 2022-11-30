import * as BSON from '../../register-bson';
import { bufferFromHexArray } from '../tools/utils';
import { expect } from 'chai';

describe('serialize()', () => {
  it('should only enumerate own property keys from input objects', () => {
    const input = { a: 1 };
    Object.setPrototypeOf(input, { b: 2 });
    const bytes = BSON.serialize(input);
    expect(bytes).to.deep.equal(
      bufferFromHexArray([
        '106100', // type int32, a\x00
        '01000000' // int32LE = 1
      ])
    );
  });
});
