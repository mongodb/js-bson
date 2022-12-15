import { expect } from 'chai';
import {
  BSON,
  EJSON,
  Binary,
  BSONRegExp,
  BSONSymbol,
  Code,
  DBRef,
  Decimal128,
  Double,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  Timestamp,
  UUID
} from '../register-bson';

const BSONTypeClasses = {
  Binary: () => {
    return new Binary(Buffer.alloc(3));
  },
  Code: () => {
    return new Code('function () {}');
  },
  DBRef: () => {
    return new DBRef('test', new ObjectId('00'.repeat(12)));
  },
  Decimal128: () => {
    return new Decimal128('1.28');
  },
  Double: () => {
    return new Double(1.28);
  },
  Int32: () => {
    return new Int32(1);
  },
  Long: () => {
    return Long.fromNumber(1);
  },
  MinKey: () => {
    return new MinKey();
  },
  MaxKey: () => {
    return new MaxKey();
  },
  ObjectId: () => {
    return new ObjectId('00'.repeat(12));
  },
  BSONRegExp: () => {
    return new BSONRegExp('abc', 'i');
  },
  BSONSymbol: () => {
    return new BSONSymbol('abc');
  },
  Timestamp: () => {
    return new Timestamp({ i: 0, t: 1 });
  },
  UUID: () => {
    return new UUID('74e65f2f-6fdb-4c56-8785-bddb8ad79ea2');
  }
};

describe('Prevent previous major versions from working with BSON v5 serialize and stringify', function () {
  for (const [typeName, typeMaker] of Object.entries(BSONTypeClasses)) {
    it(`serialize throws if ${typeName} is missing a version symbol`, () => {
      const type = typeMaker();
      Object.defineProperty(type, Symbol.for('@@mdb.bson.version'), { value: null }); // set an own property that overrides the getter
      expect(() => BSON.serialize({ type })).to.throw(/Unsupported BSON version/);
      expect(() => BSON.serialize({ a: [type] })).to.throw(/Unsupported BSON version/);
      expect(() => BSON.serialize(new Map([['type', type]]))).to.throw(/Unsupported BSON version/);
    });

    it(`stringify throws if ${typeName} is missing a version symbol`, () => {
      const type = typeMaker();
      Object.defineProperty(type, Symbol.for('@@mdb.bson.version'), { value: null }); // set an own property that overrides the getter
      expect(() => EJSON.stringify({ type })).to.throw(/Unsupported BSON version/);
      expect(() => EJSON.stringify({ a: [type] })).to.throw(/Unsupported BSON version/);
    });
  }
});
