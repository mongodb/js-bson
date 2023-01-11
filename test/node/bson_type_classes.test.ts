import { expect } from 'chai';
import { __isWeb__ } from '../register-bson';
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
  UUID,
  BSONValue
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

const BSONTypeClassCtors = new Map<string, () => BSONValue>([
  ['Binary', () => new Binary()],
  ['Code', () => new Code('function () {}')],
  ['DBRef', () => new DBRef('name', new ObjectId('00'.repeat(12)))],
  ['Decimal128', () => new Decimal128('1.23')],
  ['Double', () => new Double(1.23)],
  ['Int32', () => new Int32(1)],
  ['Long', () => new Long(1n)],
  ['MinKey', () => new MinKey()],
  ['MaxKey', () => new MaxKey()],
  ['ObjectId', () => new ObjectId('00'.repeat(12))],
  ['BSONRegExp', () => new BSONRegExp('abc', 'i')],
  ['BSONSymbol', () => new BSONSymbol('name')],
  ['Timestamp', () => new Timestamp({ t: 1, i: 2 })],
  ['UUID', () => new UUID()]
]);

describe('BSON Type classes common interfaces', () => {
  context('shared inheritance from BSONValue', () => {
    before(function () {
      if (__isWeb__) {
        return this.currentTest?.skip();
      }
    });
    for (const [name, creator] of BSONTypeClassCtors) {
      it(`${name} inherits from BSONTypeClass`, () => {
        expect(creator()).to.be.instanceOf(BSONValue);
      });
    }
  });

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
