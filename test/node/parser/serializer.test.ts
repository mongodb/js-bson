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

  it('returns an empty document when the root input is nullish', () => {
    // @ts-expect-error: Testing nullish input, not supported by type defs but code works gracefully
    const emptyDocumentUndef = BSON.serialize(undefined);
    expect(emptyDocumentUndef).to.deep.equal(new Uint8Array([5, 0, 0, 0, 0]));
    // @ts-expect-error: Testing nullish input, not supported by type defs but code works gracefully
    const emptyDocumentNull = BSON.serialize(null);
    expect(emptyDocumentNull).to.deep.equal(new Uint8Array([5, 0, 0, 0, 0]));
  });

  it('does not turn nested nulls into empty documents', () => {
    const nestedNull = bufferFromHexArray([
      '0A', // null type
      '6100', // 'a\x00'
      '' // null is encoded as nothing
    ]);
    const emptyDocumentUndef = BSON.serialize({ a: undefined }, { ignoreUndefined: false });
    expect(emptyDocumentUndef).to.deep.equal(nestedNull);
    const emptyDocumentNull = BSON.serialize({ a: null });
    expect(emptyDocumentNull).to.deep.equal(nestedNull);
  });

  describe('validates input types', () => {
    it('does not permit arrays as the root input', () => {
      expect(() => BSON.serialize([])).to.throw(/does not support an array/);
    });

    it('does not non-objects as the root input', () => {
      // @ts-expect-error: Testing invalid input
      expect(() => BSON.serialize(true)).to.throw(/does not support non-object/);
      // @ts-expect-error: Testing invalid input
      expect(() => BSON.serialize(2)).to.throw(/does not support non-object/);
      // @ts-expect-error: Testing invalid input
      expect(() => BSON.serialize(2n)).to.throw(/does not support non-object/);
      // @ts-expect-error: Testing invalid input
      expect(() => BSON.serialize(Symbol())).to.throw(/does not support non-object/);
      // @ts-expect-error: Testing invalid input
      expect(() => BSON.serialize('')).to.throw(/does not support non-object/);
      expect(() =>
        BSON.serialize(function () {
          // ignore
        })
      ).to.throw(/does not support non-object/);
    });
  });
});
