import { expect } from 'chai';
import { inspect } from 'util';

import {
  ObjectId,
  Binary,
  UUID,
  Decimal128,
  Double,
  Int32,
  Long,
  Timestamp,
  Code,
  DBRef,
  MinKey,
  MaxKey,
  BSONRegExp,
  BSONSymbol,
  BSON
} from '../register-bson';

const types = [
  [ObjectId, () => new ObjectId('42'.repeat(12))],
  [Binary, () => new Binary(Uint8Array.of(1, 2, 3), 45)],
  [UUID, () => new UUID('00'.repeat(16))],
  [Decimal128, () => new Decimal128('1.23')],
  [Double, () => new Double(1.23)],
  [Int32, () => new Int32(42)],
  [Long, () => new Long(42n)],
  [Timestamp, () => new Timestamp({ i: 42, t: 42 })],
  [Code, () => new Code(function () {}, { a: 1 })],
  [DBRef, () => new DBRef('db.test', new ObjectId('42'.repeat(12)))],
  [MinKey, () => new MinKey()],
  [MaxKey, () => new MaxKey()],
  [BSONRegExp, () => new BSONRegExp('abc', 'imx')],
  [BSONSymbol, () => new BSONSymbol('abc')]
] as const;

describe('create from clone', () => {
  for (const [type, factory] of types) {
    it(`${type.name} can be made from a clone`, () => {
      const original = { value: factory() };
      const clone = structuredClone(original);
      clone.value = new (type as new (i: unknown) => typeof clone.value)(clone.value);
      if (type.name === 'DBRef') {
        clone.value.oid = new ObjectId(clone.value.oid);
      }
      expect(BSON.serialize(original)).to.deep.equal(BSON.serialize(clone));
    });
  }
});
