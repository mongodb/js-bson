import { expect } from 'chai';
import * as BSON from '../register-bson';
import { sorted, byStrings } from './tools/utils';

const EXPECTED_EXPORTS = [
  // This is our added web indicator not a real export but a small exception for this test.
  '__isWeb__',

  'BSONType',
  'BSONValue',
  'EJSON',
  'Code',
  'BSONSymbol',
  'DBRef',
  'Binary',
  'ObjectId',
  'UUID',
  'Long',
  'Timestamp',
  'Double',
  'Int32',
  'MinKey',
  'MaxKey',
  'BSONRegExp',
  'Decimal128',
  'BSONError',
  'setInternalBufferSize',
  'serialize',
  'serializeWithBufferAndIndex',
  'deserialize',
  'calculateObjectSize',
  'deserializeStream',
  'BSON'
];

const EXPECTED_EJSON_EXPORTS = ['parse', 'stringify', 'serialize', 'deserialize'];

describe('bson entrypoint', () => {
  it('should export all and only the expected keys in expected_exports', () => {
    expect(sorted(Object.keys(BSON), byStrings)).to.deep.equal(sorted(EXPECTED_EXPORTS, byStrings));
  });

  it('should export all and only the expected keys in expected_ejson_exports', () => {
    expect(sorted(Object.keys(BSON.EJSON), byStrings)).to.deep.equal(
      sorted(EXPECTED_EJSON_EXPORTS, byStrings)
    );
  });

  it('EJSON export is frozen and does not inherit the global prototype', () => {
    expect(BSON.EJSON).to.be.frozen;
    expect(Object.getPrototypeOf(BSON.EJSON)).to.be.null;
  });
});
