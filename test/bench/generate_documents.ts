import { randomBytes } from 'node:crypto';

import * as bson from '../../.';
import * as fs from 'fs';

type numericConstructor =
  | typeof bson.Double
  | typeof bson.Long
  | typeof bson.Int32
  | typeof bson.Decimal128;
type numericType = bson.Double | bson.Long | bson.Int32 | bson.Decimal128;

function generateSimpleTests(typeName: string, newFn: (...arg: any) => any) {
  const singleField = { a: newFn(0) };
  const singleElementArray = { a: [newFn(0)] };

  fs.writeFileSync(
    `./documents/${typeName}_singleFieldDocument.json`,
    bson.EJSON.stringify(singleField, { relaxed: false }, 2)
  );
  fs.writeFileSync(
    `./documents/${typeName}_singleElementArray.json`,
    bson.EJSON.stringify(singleElementArray, { relaxed: false }, 2)
  );

  for (const length of [10, 100, 1000]) {
    let counter = 0;
    const homogeneousArray = {
      a: Array.from({ length }, () => newFn(counter++))
    };
    fs.writeFileSync(
      `./documents/${typeName}_array_${length}.json`,
      bson.EJSON.stringify(homogeneousArray, { relaxed: false }, 2)
    );
  }
}

function fromNumber(type: numericConstructor, val: number): numericType {
  switch (type) {
    case bson.Double:
      return new type(val);
    case bson.Long:
      return type.fromInt(val);
    case bson.Int32:
      return new type(val);
    case bson.Decimal128:
      return type.fromString(String(val));
    default:
      throw new Error('unexpected type');
  }
}
// create numeric type tests
for (const type of [bson.Int32, bson.Decimal128, bson.Long, bson.Double]) {
  const typeName = fromNumber(type, 0)._bsontype.toLowerCase();
  generateSimpleTests(typeName, fromNumber.bind(undefined, type));
}

// no-argument types
for (const type of [bson.ObjectId, bson.MaxKey, bson.MinKey]) {
  const typeName = new type()._bsontype.toLowerCase();
  generateSimpleTests(typeName, () => new type());
}

// boolean
generateSimpleTests('boolean', () => true);

// null
generateSimpleTests('null', () => null);

// string
generateSimpleTests('string', () => randomBytes(30).toString('base64'));

// binary
generateSimpleTests('binary', () => randomBytes(30));
for (const { name, size } of [
  { name: 'small', size: 1024 },
  { name: 'medium', size: 1024 ** 2 }
  //{ name: 'large', size: 1024 ** 3 }
]) {
  const binary = new bson.Binary(randomBytes(size));
  const doc = { b: binary };
  fs.writeFileSync(
    `./documents/binary_${name}.json`,
    bson.EJSON.stringify(doc, { relaxed: false }, 2)
  );
}

// code
// without scope
generateSimpleTests(
  'code-without-scope',
  () =>
    new bson.Code(function (a: number, b: number) {
      let t: number;
      while (b !== 0) {
        t = b;
        b = a % b;
        a = t;
      }

      return a;
    })
);

// with scope
generateSimpleTests(
  'code-with-scope',
  () =>
    new bson.Code(
      function () {
        // @ts-expect-error nested
        console.log(left);
        // @ts-expect-error nested
        console.log(right);
      },
      {
        left: 100,
        right: 10_000
      }
    )
);

// Regexp - uses phone number regex
generateSimpleTests('regex', () => /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/);

// Date
generateSimpleTests('date', () => new Date());
// Generate deeply nested docs
