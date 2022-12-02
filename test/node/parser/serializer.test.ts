import * as BSON from '../../register-bson';
import { expect } from 'chai';
import { bufferFromHexArray } from '../tools/utils';
import { ByteUtils } from '../../../src/utils/byte_utils';

describe('serialize()', () => {
  describe('javascript number', () => {
    const keyA = '6100';
    const int32Type = '10';
    const doubleType = '01';
    const int32max = 0x7fff_ffff;
    const int32min = -0x8000_0000;

    const table = [
      {
        title: 'integer 0 is serialized to int32',
        input: 0,
        output: bufferFromHexArray([int32Type, keyA, '00000000'])
      },
      {
        title: 'negative zero is serialized to double',
        input: -0,
        output: bufferFromHexArray([doubleType, keyA, '0000000000000080'])
      },
      {
        title: `int32 max (${int32max}) is serialized to int32`,
        input: int32max,
        output: bufferFromHexArray([int32Type, keyA, 'FFFFFF7F'])
      },
      {
        title: `int32 min (${int32min}) is serialized to int32`,
        input: int32min,
        output: bufferFromHexArray([int32Type, keyA, '00000080'])
      },
      {
        title: `max safe integer (${Number.MAX_SAFE_INTEGER}) is serialized to double`,
        input: Number.MAX_SAFE_INTEGER,
        output: bufferFromHexArray([doubleType, keyA, 'FFFFFFFFFFFF3F43'])
      },
      {
        title: `min safe integer (${Number.MIN_SAFE_INTEGER}) is serialized to double`,
        input: Number.MIN_SAFE_INTEGER,
        output: bufferFromHexArray([doubleType, keyA, 'FFFFFFFFFFFF3FC3'])
      },
      {
        title: `int32 max + 1 (${int32max + 1}) is serialized to double`,
        input: int32max + 1,
        output: bufferFromHexArray([doubleType, keyA, '000000000000E041'])
      },
      {
        title: `int32 min - 1 (${int32min - 1}) is serialized to double`,
        input: int32min - 1,
        output: bufferFromHexArray([doubleType, keyA, '000020000000E0C1'])
      },
      {
        title: `fractional number (2.3) is serialized to double`,
        input: 2.3,
        output: bufferFromHexArray([doubleType, keyA, '6666666666660240'])
      },
      {
        title: `fractional arithmetic (1.2 + 0.8) that sums to an int is serialized to int32`,
        input: 1.2 + 0.8,
        output: bufferFromHexArray([int32Type, keyA, '02000000'])
      }
    ];

    for (const { title, input, output } of table) {
      it(title, () => {
        expect(ByteUtils.toHex(BSON.serialize({ a: input }))).to.deep.equal(
          ByteUtils.toHex(output)
        );
      });
    }
  });
});
