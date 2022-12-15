import { expect } from 'chai';
import {
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

const BSONTypeClasses = [
  Binary,
  Code,
  DBRef,
  Decimal128,
  Double,
  Int32,
  Long,
  MinKey,
  MaxKey,
  ObjectId,
  BSONRegExp,
  BSONSymbol,
  Timestamp,
  UUID
];

describe('BSON Type classes common interfaces', () => {
  for (const TypeClass of BSONTypeClasses) {
    describe(TypeClass.name, () => {
      if (TypeClass.name !== 'UUID') {
        it(`defines a _bsontype property equal to its name`, () =>
          expect(TypeClass.prototype).to.have.property('_bsontype', TypeClass.name));
      } else {
        it(`UUID inherits _bsontype from Binary`, () =>
          expect(Object.getPrototypeOf(TypeClass.prototype)).to.have.property(
            '_bsontype',
            'Binary'
          ));
      }

      it(`defines a Symbol.for('@@mdb.bson.version') property equal to 5`, () =>
        expect(TypeClass.prototype).to.have.property(Symbol.for('@@mdb.bson.version'), 5));

      it(`defines a static fromExtendedJSON() method`, () =>
        expect(TypeClass).to.have.property('fromExtendedJSON').that.is.a('function'));

      it(`defines a toExtendedJSON() method`, () =>
        expect(TypeClass.prototype).to.have.property('toExtendedJSON').that.is.a('function'));

      it(`defines an inspect() method`, () =>
        expect(TypeClass.prototype).to.have.property('inspect').that.is.a('function'));

      it(`defines a [Symbol.for('nodejs.util.inspect.custom')]() method`, () =>
        expect(TypeClass.prototype)
          .to.have.property(Symbol.for('nodejs.util.inspect.custom'))
          .that.is.a('function'));
    });
  }
});
