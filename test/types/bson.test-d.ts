import {
  expectType,
  expectError,
  expectDeprecated,
  expectNotDeprecated,
  expectAssignable
} from 'tsd';
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

// NODE-7354: constructor signature must remain (buffer?: BinarySequence, subType?: number) — runtime coercion does not loosen the typed contract
expectAssignable<(buffer?: Uint8Array | number[], subType?: number) => Binary>(
  (b, s) => new Binary(b, s)
);
expectError(new Binary(new Uint8Array(0), 'not-a-number'));
expectError(new Binary(new Uint8Array(0), true));
expectError(new Binary(new Uint8Array(0), null));
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

// NODE-7069: TimestampKept members must be accessible and non-deprecated
declare const timestamp: Timestamp;
expectNotDeprecated(timestamp.high);
expectNotDeprecated(timestamp.low);
expectNotDeprecated(timestamp.toString);
expectNotDeprecated(timestamp.equals);
expectNotDeprecated(timestamp.eq);
expectNotDeprecated(timestamp.notEquals);
expectNotDeprecated(timestamp.neq);
expectNotDeprecated(timestamp.ne);
expectNotDeprecated(timestamp.lessThan);
expectNotDeprecated(timestamp.lt);
expectNotDeprecated(timestamp.lessThanOrEqual);
expectNotDeprecated(timestamp.lte);
expectNotDeprecated(timestamp.le);
expectNotDeprecated(timestamp.greaterThan);
expectNotDeprecated(timestamp.gt);
expectNotDeprecated(timestamp.greaterThanOrEqual);
expectNotDeprecated(timestamp.gte);
expectNotDeprecated(timestamp.ge);
expectNotDeprecated(timestamp.compare);
expectNotDeprecated(timestamp.comp);
expectNotDeprecated(timestamp.isZero);
expectNotDeprecated(timestamp.eqz);

// Timestamp's own instance members must not be deprecated
expectNotDeprecated(timestamp.t);
expectNotDeprecated(timestamp.i);
expectNotDeprecated(timestamp.toJSON);

// Non-deprecated static methods
expectNotDeprecated(Timestamp.fromBits);
expectDeprecated(Timestamp.fromString);

// Deprecated static methods
expectDeprecated(Timestamp.fromInt);
expectDeprecated(Timestamp.fromNumber);

// Deprecated instance members: Arithmetic
expectDeprecated(timestamp.add);
expectDeprecated(timestamp.subtract);
expectDeprecated(timestamp.sub);
expectDeprecated(timestamp.multiply);
expectDeprecated(timestamp.mul);
expectDeprecated(timestamp.divide);
expectDeprecated(timestamp.div);
expectDeprecated(timestamp.modulo);
expectDeprecated(timestamp.mod);
expectDeprecated(timestamp.rem);
expectDeprecated(timestamp.negate);
expectDeprecated(timestamp.neg);

// Deprecated instance members: Bitwise
expectDeprecated(timestamp.and);
expectDeprecated(timestamp.or);
expectDeprecated(timestamp.xor);
expectDeprecated(timestamp.not);
expectDeprecated(timestamp.shiftLeft);
expectDeprecated(timestamp.shl);
expectDeprecated(timestamp.shiftRight);
expectDeprecated(timestamp.shr);
expectDeprecated(timestamp.shiftRightUnsigned);
expectDeprecated(timestamp.shr_u);
expectDeprecated(timestamp.shru);

// Deprecated instance members: Signing
expectDeprecated(timestamp.toSigned);
expectDeprecated(timestamp.toUnsigned);
expectDeprecated(timestamp.isNegative);
expectDeprecated(timestamp.isPositive);
expectDeprecated(timestamp.unsigned);

// Deprecated instance members: Conversion
expectDeprecated(timestamp.toInt);
expectDeprecated(timestamp.toNumber);
expectDeprecated(timestamp.toBigInt);
expectDeprecated(timestamp.toBytes);
expectDeprecated(timestamp.toBytesLE);
expectDeprecated(timestamp.toBytesBE);

// Deprecated instance members: Other
expectDeprecated(timestamp.getHighBits);
expectDeprecated(timestamp.getHighBitsUnsigned);
expectDeprecated(timestamp.getLowBits);
expectDeprecated(timestamp.getLowBitsUnsigned);
expectDeprecated(timestamp.__isLong__);
expectDeprecated(timestamp.getNumBitsAbs);
expectDeprecated(timestamp.isEven);
expectDeprecated(timestamp.isOdd);
