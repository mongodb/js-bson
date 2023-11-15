/**
 * This script regenerates all benchmark test files
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes, randomInt } from 'node:crypto';

import * as bson from '../../../.';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

type numericConstructor =
  | typeof bson.Double
  | typeof bson.Long
  | typeof bson.Int32
  | typeof bson.Decimal128;
type numericType = bson.Double | bson.Long | bson.Int32 | bson.Decimal128;

const DOCUMENT_PATH = resolve(`${__dirname}/../documents`);

function generateSimpleTests(typeName: string, newFn: (...arg: any) => any) {
  const singleField = { a: newFn(0) };
  const singleElementArray = { a: [newFn(0)] };

  writeFileSync(
    `${DOCUMENT_PATH}/${typeName}_singleFieldDocument.json`,
    bson.EJSON.stringify(singleField, { relaxed: false }, 2)
  );
  writeFileSync(
    `${DOCUMENT_PATH}/${typeName}_singleElementArray.json`,
    bson.EJSON.stringify(singleElementArray, { relaxed: false }, 2)
  );

  for (const length of [10, 100, 1000]) {
    let counter = 0;
    const homogeneousArray = {
      a: Array.from({ length }, () => newFn(counter++))
    };
    writeFileSync(
      `${DOCUMENT_PATH}/${typeName}_array_${length}.json`,
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
generateSimpleTests('binary', () => new bson.Binary(randomBytes(30)));
for (const { name, size } of [
  { name: 'small', size: 1024 },
  { name: 'medium', size: 1024 ** 2 }
]) {
  const binary = new bson.Binary(randomBytes(size));
  const doc = { b: binary };
  writeFileSync(
    `${DOCUMENT_PATH}/binary_${name}.json`,
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
// Timestamp
generateSimpleTests('timestamp', () => bson.Timestamp.fromNumber(Date.now() / 1000));

// Generate deeply nested docs
function newTree(depth: number, tree: any = {}) {
  if (depth === 0) return tree;
  if (depth === 1) {
    tree.left = true;
    tree.right = false;
    return tree;
  }

  tree.left = newTree(depth - 1);
  tree.right = newTree(depth - 1);

  return tree;
}

for (const depth of [4, 8, 16]) {
  const doc: Record<string, any> = newTree(depth);

  writeFileSync(
    `${DOCUMENT_PATH}/nested_${depth}.json`,
    bson.EJSON.stringify(doc, undefined, 2, { relaxed: false })
  );
}

// Generate large flat mixed documents
for (const { bytes, classification } of [
  { bytes: 100, classification: 'small' },
  { bytes: 1024, classification: 'medium' },
  { bytes: 1024 ** 2, classification: 'large' }
]) {
  const getKey = () => randomBytes(30).toString('hex');

  const doc: any = {};
  let currentSize = bson.calculateObjectSize(doc);
  while (currentSize < bytes) {
    doc[getKey()] = randomBytes(30).toString('hex');
    doc[getKey()] = new bson.Int32(randomInt(2 ** 31));
    doc[getKey()] = bson.Long.fromNumber(randomInt(2 ** 32));
    doc[getKey()] = bson.Decimal128.fromString(`${randomInt(2 ** 20)}.${randomInt(2 ** 20)}`);
    doc[getKey()] = new bson.ObjectId();
    doc[getKey()] = new Date();
    doc[getKey()] = new bson.Timestamp(randomBytes(8).readBigInt64LE());
    doc[getKey()] = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    doc[getKey()] = randomInt(100) < 50;
    doc[getKey()] = new bson.Double(randomInt(2 ** 32));

    currentSize = bson.calculateObjectSize(doc);
  }

  writeFileSync(
    `${DOCUMENT_PATH}/mixed_${classification}.json`,
    bson.EJSON.stringify(doc, { relaxed: false }, 2)
  );
}
