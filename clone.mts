import {
    BSON,
    BSONType,
    Double,
    Binary,
    ObjectId,
    BSONRegExp,
    Code,
    BSONSymbol,
    Int32,
    Timestamp,
    Long,
    Decimal128,
    MinKey,
    MaxKey,
} from './lib/bson.mjs';

const double = new Double(4.2)

const doc = {
    double,
    string: 'abc',
    object: { a: 1 },
    array: ['item'],
    binData: Binary.createFromHexString('4242', 42),
    // undefined: new ,
    objectId: new ObjectId('42'.repeat(12)),
    bool: true,
    date: new Date(0),
    null: null,
    regex: new BSONRegExp('abc', 'imx'),
    // dbPointer: new ,
    javascript: new Code(function () {}),
    symbol: new BSONSymbol('abc'),
    javascriptWithScope: new Code(function () {}, { a: 1 }),
    int: new Int32(42),
    timestamp: new Timestamp({ i: 42, t: 42 }),
    long: Long.fromBigInt(42n),
    decimal: new Decimal128('4.2'),
    minKey: new MinKey(),
    maxKey: new MaxKey(),
}

console.log(doc);

console.log(structuredClone(doc));
