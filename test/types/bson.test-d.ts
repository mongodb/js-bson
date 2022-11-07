import { expectType, expectError } from 'tsd';
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
  BSONRegExp,
  BSONSymbol,
  Timestamp,
  UUID,
  DBRefLike,
  Document,
  Decimal128Extended
} from '../../bson'; // import from generated bson.d.ts

expectType<() => UUID>(Binary.prototype.toUUID);
expectType<() => Binary>(UUID.prototype.toBinary);

expectType<(encoding?: 'hex' | 'base64' | 'utf8' | 'utf-8') => string>(Binary.prototype.toString);
expectType<(radix?: number) => string>(Double.prototype.toString);
expectType<(radix?: number) => string>(Long.prototype.toString);
expectType<(radix?: number) => string>(Int32.prototype.toString);

expectType<() => Decimal128Extended>(Decimal128.prototype.toJSON);
expectType<
  () => {
    code: string | Function;
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

// ObjectID uses a capital for backwards compatibility
expectType<'ObjectID'>(ObjectId.prototype._bsontype)
// BSONSymbol was renamed to not conflict with the global JS Symbol
// but its _bsontype is still 'Symbol'
expectType<'Symbol'>(BSONSymbol.prototype._bsontype)

// We hack TS to say that the prototype has _bsontype='Timestamp'
// but it actually is _bsontype='Long', inside the Timestamp constructor
// we override the property on the instance
// TODO(NODE-2624): Make Timestamp hold its long value on a property rather than be a subclass
expectType<'Timestamp'>(Timestamp.prototype._bsontype)

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
