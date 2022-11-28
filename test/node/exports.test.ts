import * as BSON from '../register-bson';
import { sorted, byStrings } from './tools/utils';

const EXPECTED_EXPORTS = [
  // This is our added web indicator not a real export but a small exception for this test.
  '__isWeb__',

  'BSON_BINARY_SUBTYPE_BYTE_ARRAY',
  'BSON_BINARY_SUBTYPE_DEFAULT',
  'BSON_BINARY_SUBTYPE_FUNCTION',
  'BSON_BINARY_SUBTYPE_MD5',
  'BSON_BINARY_SUBTYPE_USER_DEFINED',
  'BSON_BINARY_SUBTYPE_UUID',
  'BSON_BINARY_SUBTYPE_UUID_NEW',
  'BSON_BINARY_SUBTYPE_ENCRYPTED',
  'BSON_BINARY_SUBTYPE_COLUMN',
  'BSON_DATA_ARRAY',
  'BSON_DATA_BINARY',
  'BSON_DATA_BOOLEAN',
  'BSON_DATA_CODE',
  'BSON_DATA_CODE_W_SCOPE',
  'BSON_DATA_DATE',
  'BSON_DATA_DBPOINTER',
  'BSON_DATA_DECIMAL128',
  'BSON_DATA_INT',
  'BSON_DATA_LONG',
  'BSON_DATA_MAX_KEY',
  'BSON_DATA_MIN_KEY',
  'BSON_DATA_NULL',
  'BSON_DATA_NUMBER',
  'BSON_DATA_OBJECT',
  'BSON_DATA_OID',
  'BSON_DATA_REGEXP',
  'BSON_DATA_STRING',
  'BSON_DATA_SYMBOL',
  'BSON_DATA_TIMESTAMP',
  'BSON_DATA_UNDEFINED',
  'BSON_INT32_MAX',
  'BSON_INT32_MIN',
  'BSON_INT64_MAX',
  'BSON_INT64_MIN',
  'EJSON',
  'Code',
  'BSONSymbol',
  'DBRef',
  'Binary',
  'ObjectId',
  'UUID',
  'Long',
  'LongWithoutOverridesClass',
  'Timestamp',
  'Double',
  'Int32',
  'MinKey',
  'MaxKey',
  'BSONRegExp',
  'Decimal128',
  'ObjectID',
  'BSONError',
  'BSONTypeError',
  'setInternalBufferSize',
  'serialize',
  'serializeWithBufferAndIndex',
  'deserialize',
  'calculateObjectSize',
  'deserializeStream',
  'default'
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
});
