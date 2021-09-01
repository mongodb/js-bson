import { expectAssignable, expectError, expectType } from 'tsd';
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
    UUID
} from '../../bson'

expectType<() => UUID>(Binary.prototype.toUUID);
expectType<() => Binary>(UUID.prototype.toBinary);

expectType<(format?: string) => string>(Binary.prototype.toString);
expectType<(radix?: number) => string>(Double.prototype.toString);
expectType<(radix?: number) => string>(Long.prototype.toString);
expectType<(radix?: number) => string>(Int32.prototype.toString);

expectAssignable<() => any>(Decimal128.prototype.toJSON);
expectAssignable<() => any>(Code.prototype.toJSON);
expectAssignable<() => any>(DBRef.prototype.toJSON);
expectAssignable<() => any>(ObjectId.prototype.toJSON);
expectAssignable<() => any>(BSONSymbol.prototype.toJSON);
expectAssignable<() => any>(Timestamp.prototype.toJSON);
expectAssignable<() => any>(Binary.prototype.toJSON);
expectAssignable<() => any>(Double.prototype.toJSON);
expectAssignable<() => any>(Int32.prototype.toJSON);

expectError(MaxKey.prototype.toJSON);
expectError(MinKey.prototype.toJSON);
expectError(Long.prototype.toJSON);
expectError(BSONRegExp.prototype.toJSON);
