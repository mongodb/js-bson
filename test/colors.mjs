/** Used to generate screenshots for introducing color to BSON inspect function */

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
  c: new Code(
    function iLoveJavaScript() {
      do {
        console.log('hello!');
      } while (Math.random() > 0.5);
    },
    { context: 'random looping!', reference: Long.fromString('2345'), my_map: {a:1}}
  ),
  c2: new Code (
    function iLoveJavaScript() { return `js`; },
    { context: 'random looping!', reference: Long.fromString('2345'), my_map: {a:1}}
  ),
  dbref: new DBRef('collection', new ObjectId('00'.repeat(12))),
  dbref_db: new DBRef('collection', new ObjectId('00'.repeat(12)), 'db'),
  dbref_db_fields: new DBRef('collection', new ObjectId('00'.repeat(12)), 'db', { a: 1 }),
  decimal128: new Decimal128('1.353e34'),
  double: new Double(2.354),
  double2: new Double(2),
  double3: new Double(-0),
  int32: new Int32('4577'),
  long: new Long(-12442),
  objectid: new ObjectId('00'.repeat(12)),
  bsonregexp: new BSONRegExp('abc', 'imx'),
  bsonsymbol: new BSONSymbol('my symbol'),
  timestamp: new Timestamp({ i: 2345, t: 23453 }),
  maxkey: new MaxKey(),
  minkey: new MinKey()
});

const oid = new ObjectId('00'.repeat(12));
console.log(oid);