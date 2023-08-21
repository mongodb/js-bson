import { expect } from 'chai';
import { BSONSymbol, BSON } from '../register-bson';
import { bufferFromHexArray } from './tools/utils';
import { inspect } from 'util';

describe('class BSONSymbol', () => {
  it('get _bsontype returns BSONSymbol', () => {
    const sym = new BSONSymbol('symbol');
    expect(sym).to.have.property('_bsontype', 'BSONSymbol');
  });

  it('serializes to a bson symbol type', () => {
    const bytes = bufferFromHexArray([
      '0E', // bson symbol
      Buffer.from('sym\x00', 'utf8').toString('hex'),
      '07000000', // 6 bytes
      Buffer.from('symbol\x00').toString('hex')
    ]);

    expect(BSON.serialize({ sym: new BSONSymbol('symbol') })).to.deep.equal(bytes);
  });

  it('deserializes to js string by default', () => {
    const bytes = bufferFromHexArray([
      '0E', // bson symbol
      Buffer.from('sym\x00', 'utf8').toString('hex'),
      '07000000', // 6 bytes
      Buffer.from('symbol\x00').toString('hex')
    ]);

    expect(BSON.deserialize(bytes)).to.have.property('sym', 'symbol');
  });

  it('deserializes to BSONSymbol if promoteValues is false', () => {
    const bytes = bufferFromHexArray([
      '0E', // bson symbol
      Buffer.from('sym\x00', 'utf8').toString('hex'),
      '07000000', // 6 bytes
      Buffer.from('symbol\x00').toString('hex')
    ]);

    const result = BSON.deserialize(bytes, { promoteValues: false });
    expect(result).to.have.nested.property('sym._bsontype', 'BSONSymbol');
  });

  it('prints re-evaluatable output for BSONSymbol that contains quotes', () => {
    const input = new BSONSymbol('asdf"ghjk');
    expect(inspect(input)).to.equal(String.raw`new BSONSymbol("asdf\"ghjk")`);
  });
});
