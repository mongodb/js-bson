import { expect } from 'chai';
import * as BSON from '../register-bson';
import { sorted, byStrings } from './tools/utils';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

const EXPECTED_EXPORTS = [
  // This is our added web indicator not a real export but a small exception for this test.
  '__isWeb__',
  '__noBigInt__',

  'BSONType',
  'BSONValue',
  'BSONVersionError',
  'EJSON',
  'Code',
  'BSONSymbol',
  'DBRef',
  'Binary',
  'ObjectId',
  'onDemand',
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
  'BSONRuntimeError',
  'BSONOffsetError',
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

  context('package.json entrypoint', () => {
    let pkg: typeof import('../../package.json');
    before(async () => {
      pkg = await readFile(resolve(__dirname, '../../package.json'), {
        encoding: 'utf8'
        // JSON.parse will preserve key order
      }).then(c => JSON.parse(c));
    });

    it('maintains the order of keys in exports conditions', async () => {
      expect(pkg).property('exports').is.a('object');
      expect(pkg).nested.property('exports.browser').is.a('object');
      expect(pkg).nested.property('exports.default').is.a('object');

      expect(
        Object.keys(pkg.exports),
        'Order matters in the exports fields. import/require need to proceed the "bundler" targets (RN/browser) and react-native MUST proceed browser'
      ).to.deep.equal(['browser', 'react-native', 'default']);

      // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#packagejson-exports-imports-and-self-referencing
      expect(
        Object.keys(pkg.exports.browser),
        'TS docs say that `types` should ALWAYS proceed `default`'
      ).to.deep.equal(['types', 'default']);
      expect(
        Object.keys(pkg.exports.default),
        'TS docs say that `types` should ALWAYS proceed `default`'
      ).to.deep.equal(['types', 'import', 'require']);

      expect(Object.keys(pkg['compass:exports'])).to.deep.equal(['import', 'require']);
    });

    it('has the equivalent "bson.d.ts" value for all "types" specifiers', () => {
      expect(pkg).property('types', 'bson.d.ts');
      expect(pkg).nested.property('exports.browser.types', './bson.d.ts');
      expect(pkg).nested.property('exports.default.types', './bson.d.ts');
    });
  });
});
