'use strict';

import {
  Binary,
  UUID,
  Code,
  DBRef,
  Decimal128,
  Double,
  Int32,
  Long,
  ObjectId,
  BSONRegExp,
  BSONSymbol,
  Timestamp,
  MaxKey,
  MinKey
} from '../lib/bson.mjs';

console.log({
  binary: new Binary(Buffer.from('abcdef', 'utf8'), 0x06),
  uuid: new UUID(),
  code: new Code(function iLoveJavaScript() {
    do {
      console.log('hello!');
    } while (Math.random() > 0.5);
  }),
  code_w_scope: new Code(
    function iLoveJavaScript() {
      do {
        console.log('hello!');
      } while (Math.random() > 0.5);
    },
    { context: 'random looping!', reference: Long.fromString('2345') }
  ),
  dbref: new DBRef('collection', new ObjectId('00'.repeat(12))),
  dbref_db: new DBRef('collection', new ObjectId('00'.repeat(12)), 'db'),
  dbref_db_fields: new DBRef('collection', new ObjectId('00'.repeat(12)), 'db', { a: 1 }),
  decimal128: new Decimal128('1.353e34'),
  double: new Double(2.354),
  int32: new Int32('4577'),
  long: new Long(-12442),
  objectid: new ObjectId('00'.repeat(12)),
  bsonregexp: new BSONRegExp('abc', 'imx'),
  bsonsymbol: new BSONSymbol('my symbol'),
  timestamp: new Timestamp({ i: 2345, t: 23453 }),
  maxkey: new MaxKey(),
  minkey: new MinKey()
});
