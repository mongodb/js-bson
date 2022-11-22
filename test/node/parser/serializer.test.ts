import * as BSON from '../../register-bson';
import { expect } from 'chai';

describe('serialize()', () => {
  it('should only enumerate own property keys from input objects', () => {
    const input = { a: 1 };
    Object.setPrototypeOf(input, { b: 2 });
    const bytes = BSON.serialize(input);
    expect(bytes).to.have.property('byteLength', 12);
    expect(Array.from(bytes)).to.include('a'.charCodeAt(0));
    expect(Array.from(bytes)).to.not.include('b'.charCodeAt(0));
  });
});
