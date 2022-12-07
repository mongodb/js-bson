# Changes in v5

## TOC

- [Changes to Support Cross-platform JS API Compatibility](#changes-to-support-cross-platform-js-api-compatibility)
  - [Remove reliance on Node.js Buffer](#remove-reliance-on-nodejs-buffer)
    - [Impacted APIs now return Uint8Array in web environments; Node.js environments unaffected](#apis-impacted)
  - [Restrict supported encodings in `ObjectId.toString` / `UUID.toString` / `Binary.toString`](#restrict-supported-encodings-in-objectidtostring--uuidtostring--binarytostring)
    - [Migration available if types beyond `'hex' | 'base64' | 'utf8'` are desired](#migration-example)
- [Other Changes](#other-changes)
  - [serializeFunctions bug fix](#serializefunctions-bug-fix)
  - [TS "target" set to es2020](#ts-target-set-to-es2020)

## About

The following is a detailed collection of the changes in the major v5 release of the bson package
for Node.js and web platforms.

<!--
1. a brief statement of what is breaking (brief as in "x will now return y instead of z", or "x is no longer supported, use y instead", etc
2. a brief statement of why we are breaking it (bug, not useful, inconsistent behavior, better alternative, etc)
3. if applicable, an example of suggested syntax change (can be included in (1) )
-->

## Changes to Support Cross-platform JS API Compatibility

### Remove reliance on Node.js Buffer

> **TL;DR**: Impacted APIs now return Uint8Array in web environments; Node.js environments unaffected

For those that use the BSON library on Node.js, there is no change - the BSON APIs will still return and accept instances of Node.js Buffer. Since we no longer depend on the Buffer web shim for compatibility with browsers, in non-Node.js environments a Uint8Array will be returned instead.

This allows the BSON library to be better at platform independence while keeping its behavior consistent cross platform. The Buffer shim served the library well but brought in more than was necessary for the concerns of the code here.

#### APIs impacted

The following APIs now return Uint8Arrays when the library is loaded in an environment that does not define a global Node.js Buffer.

- `Binary.prototype.buffer`
- `Binary.prototype.read()`
- `Binary.prototype.value()`
- `Decimal128.prototype.bytes`
- `ObjectId.prototype.id`
- `ObjectId.generate()`
- `serialize()`
- `UUID.prototype.id`
- `UUID.generate()`

### Restrict supported encodings in `ObjectId.toString` / `UUID.toString` / `Binary.toString`

> **TL;DR**: The only supported encodings are: `'hex' | 'base64' | 'utf8'`

The methods: `ObjectId.toString`, `UUID.toString`, and `Binary.toString` took encodings that were passed through to the Node.js Buffer API. As a result of no longer relying on the presence of `Buffer` we can no longer support [every encoding that Node.js does](https://nodejs.org/dist/latest-v16.x/docs/api/buffer.html#buffers-and-character-encodings). We continue to support `'hex'` and `'base64'` on all three methods and additionally `'utf-8' | 'utf8'` on `Binary.toString`. If any of the other encodings are desired the underlying buffer for all these classes are publicly accessible and while in Node.js will be stored as a Node.js buffer:

#### Migration Example

```typescript
// Given Binary constructed from one of the encodings (using 'utf16le' as an example here)
// no longer supported directly by the Binary.toString method
const bin = new Binary(Buffer.from('abc', 'utf16le'), 0);
// To obtain the original translation of bytes to string
// We can access the underlying buffer and on Node.js it will be an instanceof Buffer
// so it will support the translation to the specified encoding.
bin.value(true).toString('utf16le');
// In web environments (and Node.js) the same can be accomplished with TextDecoder
new TextDecoder('utf-16le').decode(bin.value(true));
```

## Other Changes

### TS "target" set to es2020

We have set our typescript compilation target to `es2020` which aligns with our minimum supported Node.js version 14+. The following is from the typescript release notes on es2020 support, so it's some of the syntax that can be expected to be preserved after compilation:

> This will preserve newer ECMAScript 2020 features like optional chaining, nullish coalescing, export \* as ns, and dynamic import(...) syntax. It also means bigint literals now have a stable target below esnext.

### serializeFunctions bug fix

> **TL;DR**: TODO

TODO(NODE-4771): serializeFunctions bug fix makes function names outside the ascii range get serialized correctly

### Remove `Map` export

This library no longer polyfills [ES Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) and the export "Map" was removed. Users should migrate to using the global Map constructor available in all supported JS environments.

### `Decimal128` `toObject()` mapper support removed

`Decimal128` can no longer have a `toObject()` method added on to its prototype for mapping to a custom value. This feature was undocumented and inconsistent with the rest of our BSON types. At this time there is no direct migration: cursors in the driver support transformations via `.map`, otherwise the `Decimal128` instances will require manual transformation. There is a plan to provide a better mechanism for consistently transforming BSON values tracked in [NODE-4680](https://jira.mongodb.org/browse/NODE-4680), please feel free to add a vote or comment with a use case to help us land the feature in the most useful form.

### Remove deprecated ObjectId methods

The following deprecated methods have been removed:

- `ObjectId.prototype.generate`
  - Instead, generate a new ObjectId with the constructor: `new ObjectId()` or using the `static generate(time?: number)` method.
- `ObjectId.prototype.generationTime`
  - Instead, use `static createFromTime()` and `getTimestamp()` to set and inspect these values on an `ObjectId()`
- `ObjectId.prototype.getInc`
- `ObjectId.prototype.get_inc`
- `ObjectId.get_inc`
  - The `static getInc()` is private since invoking it increments the next `ObjectId` index, so invoking would impact the creation of subsequent ObjectIds.

### BSON Element names are now fetched only from object's own properties

`BSON.serialize`, `EJSON.stringify` and `BSON.calculateObjectSize` now only inspect own properties and do not consider properties defined on the prototype of the input.

```typescript
const object = { a: 1 };
Object.setPrototypeOf(object, { b: 2 });
BSON.deserialize(BSON.serialize(object));
// now returns { a: 1 } in v5.0
// would have returned { a: 1, b: 2 } in v4.x
```

### Negative Zero is now serialized to Double

BSON serialize will now preserve negative zero values as a floating point number.

Previously it was required to use the `Double` type class to preserve `-0`:
```ts
BSON.deserialize(BSON.serialize({ d: -0 }))
// no type preservation, returns { d: 0 }
BSON.deserialize(BSON.serialize({ d: new Double(-0) }))
// type preservation, returns { d: -0 }
```

Now `-0` can be used directly
```ts
BSON.deserialize(BSON.serialize({ d: -0 }))
// type preservation, returns { d: -0 }
```

### `BSON.serialize()` validation

The BSON format does not support encoding arrays as the **root** object.
However, in javascript arrays are just objects where the keys are numeric (and a magic `length` property), so round tripping an array (ex. `[1, 2]`) though BSON would return `{ '0': 1, '1': 2 }`.

`BSON.serialize()` now validates input types, the input to serialize must be an object or a `Map`, arrays will now cause an error.

```typescript
BSON.serialize([1, 2, 3])
// BSONError: serialize does not support an array as the root input
```

if the functionality of turning arrays into an object with numeric keys is useful see the following example:

```typescript
// Migration example:
const result = BSON.serialize(Object.fromEntries([1, true, 'blue'].entries()))
BSON.deserialize(result)
// { '0': 1, '1': true, '2': 'blue' }
```
