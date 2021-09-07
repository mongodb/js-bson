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

expectType<(format?: string) => string>(Binary.prototype.toString);
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
