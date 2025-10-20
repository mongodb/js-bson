import { expectType, expectError , expectDeprecated, expectNotDeprecated } from 'tsd';
import {
  Binary,
  Code,
  DBRef,
  Decimal128,
  Double,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  ObjectIdLike,
  BSONRegExp,
  BSONSymbol,
  Timestamp,
  UUID,
  DBRefLike,
  Document,
  Decimal128Extended,
  BSONValue,
  bsonType,
  BSONTypeTag
} from '../../bson'; // import from generated bson.d.ts
import type { InspectFn } from '../../src/parser/utils';

expectType<() => UUID>(Binary.prototype.toUUID);
expectType<() => Binary>(UUID.prototype.toBinary);

expectType<(encoding?: 'hex' | 'base64' | 'utf8' | 'utf-8') => string>(Binary.prototype.toString);
expectType<(radix?: number) => string>(Double.prototype.toString);
expectType<(radix?: number) => string>(Long.prototype.toString);
expectType<(radix?: number) => string>(Int32.prototype.toString);

expectType<() => Decimal128Extended>(Decimal128.prototype.toJSON);
expectType<
  () => {
    code: string;
    scope?: Document;
  }
>(Code.prototype.toJSON);
expectType<() => DBRefLike & Document>(DBRef.prototype.toJSON);
expectType<() => string>(ObjectId.prototype.toJSON);
expectType<() => string>(BSONSymbol.prototype.toJSON);
expectType<
  () => {
    $timestamp: string;
  }
>(Timestamp.prototype.toJSON);
expectType<() => string>(Binary.prototype.toJSON);
expectType<() => number>(Double.prototype.toJSON);
expectType<() => number>(Int32.prototype.toJSON);

expectError(MaxKey.prototype.toJSON);
expectError(MinKey.prototype.toJSON);
expectError(Long.prototype.toJSON);
expectError(BSONRegExp.prototype.toJSON);

// We hack TS to say that the prototype has _bsontype='Timestamp'
// but it actually is _bsontype='Long', inside the Timestamp constructor
// we override the property on the instance
// TODO(NODE-2624): Make Timestamp hold its long value on a property rather than be a subclass
expectType<'Timestamp'>(Timestamp.prototype._bsontype)

expectType<'ObjectId'>(ObjectId.prototype._bsontype)
expectType<'BSONSymbol'>(BSONSymbol.prototype._bsontype)
expectType<'Binary'>(Binary.prototype._bsontype)
expectType<'Code'>(Code.prototype._bsontype)
expectType<'DBRef'>(DBRef.prototype._bsontype)
expectType<'Decimal128'>(Decimal128.prototype._bsontype)
expectType<'Double'>(Double.prototype._bsontype)
expectType<'Int32'>(Int32.prototype._bsontype)
expectType<'Long'>(Long.prototype._bsontype)
expectType<'MaxKey'>(MaxKey.prototype._bsontype)
expectType<'MinKey'>(MinKey.prototype._bsontype)
expectType<'BSONRegExp'>(BSONRegExp.prototype._bsontype)
expectType<'Binary'>(UUID.prototype._bsontype)

expectType<'Timestamp'>(Timestamp.prototype[bsonType])
expectType<'ObjectId'>(ObjectId.prototype[bsonType])
expectType<'BSONSymbol'>(BSONSymbol.prototype[bsonType])
expectType<'Binary'>(Binary.prototype[bsonType])
expectType<'Code'>(Code.prototype[bsonType])
expectType<'DBRef'>(DBRef.prototype[bsonType])
expectType<'Decimal128'>(Decimal128.prototype[bsonType])
expectType<'Double'>(Double.prototype[bsonType])
expectType<'Int32'>(Int32.prototype[bsonType])
expectType<'Long'>(Long.prototype[bsonType])
expectType<'MaxKey'>(MaxKey.prototype[bsonType])
expectType<'MinKey'>(MinKey.prototype[bsonType])
expectType<'BSONRegExp'>(BSONRegExp.prototype[bsonType])
expectType<'Binary'>(UUID.prototype[bsonType])

// Common BSONValue interface
declare const bsonValue: BSONValue;
expectType<BSONTypeTag>(bsonValue._bsontype);
expectType<BSONTypeTag>(bsonValue[bsonType]);
expectType<(depth?: number | undefined, options?: unknown, inspect?: InspectFn | undefined) => string>(bsonValue.inspect);

expectNotDeprecated(new ObjectId('foo'));
expectError(new ObjectId(42));
expectError(new ObjectId(42 as string | number));

// Timestamp accepts timestamp because constructor allows: {i:number, t:number}
new Timestamp(new Timestamp(0n))

expectType<(position: number, length: number) => Uint8Array>(Binary.prototype.read);
