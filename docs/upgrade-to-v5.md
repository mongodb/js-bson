# Changes in v5

## TOC

- [Changes to Support Cross-platform JS API Compatibility](#changes-to-support-cross-platform-js-api-compatibility)
  - [Remove reliance on Node.js `Buffer`](#remove-reliance-on-nodejs-buffer)
    - [Impacted APIs now return `Uint8Array` in web environments; Node.js environments are unaffected](#apis-impacted)
  - [Restrict supported encodings in `ObjectId.toString` / `UUID.toString` / `Binary.toString`](#restrict-supported-encodings-in-objectidtostring--uuidtostring--binarytostring)
    - [Migration available if types beyond `'hex' | 'base64' | 'utf8'` are desired](#migration-example)
- [Other Changes](#other-changes)
  - [`serializeFunctions` bug fix](#serializefunctions-bug-fix)
  - [TS "target" set to es2020](#ts-target-set-to-es2020)

## About

The following is a detailed collection of the changes in the major v5 release of the BSON package for Node.js and web platforms.

<!--
1. a brief statement of what is breaking (brief as in "x will now return y instead of z", or "x is no longer supported, use y instead", etc
2. a brief statement of why we are breaking it (bug, not useful, inconsistent behavior, better alternative, etc)
3. if applicable, an example of suggested syntax change (can be included in (1) )
-->

## Changes to Support Cross-platform JS API Compatibility

### Remove reliance on Node.js Buffer

> **TL;DR**: Impacted APIs now return `Uint8Array` in web environments; Node.js environments are unaffected

For those that use the BSON library on Node.js, there is no change - the BSON APIs will still return and accept instances of Node.js `Buffer`. Since we no longer depend on the `Buffer` web shim for compatibility with browsers, in non-Node.js environments a `Uint8Array` will be returned instead.

This allows the BSON library to be more platform independent while keeping its behavior consistent cross platform. 

#### APIs impacted

The following APIs now return `Uint8Arrays` when the library is loaded in an environment that does not define a global Node.js `Buffer`.

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

The methods: `ObjectId.toString`, `UUID.toString`, and `Binary.toString` took encodings that were passed through to the Node.js `Buffer` API. As a result of no longer relying on the presence of `Buffer` we can no longer support [every encoding that Node.js does](https://nodejs.org/dist/latest-v16.x/docs/api/buffer.html#buffers-and-character-encodings). We continue to support `'hex'` and `'base64'` on all three methods and additionally `'utf-8' | 'utf8'` on `Binary.toString`. If any of the other encodings are desired the underlying buffer for all these classes are publicly accessible and while in Node.js will be stored as a Node.js buffer:

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

We have set our TypeScript compilation target to `es2020` which aligns with our minimum supported Node.js version 14+. The following is from the [TypeScript release notes on `es2020` support](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#es2020-for-target-and-module), so it's some of the syntax that can be expected to be preserved after compilation:

> This will preserve newer ECMAScript 2020 features like optional chaining, nullish coalescing, export \* as ns, and dynamic import(...) syntax. It also means bigint literals now have a stable target below esnext.

### `serializeFunctions` bug fix

If `serializeFunctions` was enabled and the functions being serialized had a name that is outside of [Controls and Basic Latin](https://en.wikibooks.org/wiki/Unicode/Character_reference/0000-0FFF) character ranges (a.k.a utf8 bytes: `0x00-0x7F`) they would be incorrectly serialized.

### Remove `Map` export

This library no longer polyfills [ES Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) and the export "`Map`" was removed. Users should migrate to using the global `Map` constructor available in all supported JS environments.

### `Decimal128` `toObject()` mapper support removed

`Decimal128` can no longer have a `toObject()` method added on to its prototype for mapping to a custom value. This feature was undocumented and inconsistent with the rest of our BSON types. 

At this time there is no direct migration. Cursors in the driver support transformations via `.map`, otherwise the `Decimal128` instances will require manual transformation. There is a plan to provide a better mechanism for consistently transforming BSON values tracked in [NODE-4680](https://jira.mongodb.org/browse/NODE-4680). Please feel free to add a vote or comment with a use case to help us land the feature in the most useful form.

### Remove deprecated `ObjectId` methods

The following deprecated methods have been removed:

- `ObjectId.prototype.generate`
  - Instead, generate a new `ObjectId` with the constructor: `new ObjectId()` or using the `static generate(time?: number)` method.
- `ObjectId.prototype.generationTime`
  - Instead, use `static createFromTime()` and `getTimestamp()` to set and inspect these values on an `ObjectId()`
- `ObjectId.prototype.getInc`
- `ObjectId.prototype.get_inc`
- `ObjectId.get_inc`
  - The `static getInc()` is private since invoking it increments the next `ObjectId` index, so invoking would impact the creation of subsequent `ObjectId`s.

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

### Capital "D" `ObjectID` export removed

For clarity the deprecated and duplicate export `ObjectID` has been removed. `ObjectId` matches the class name and is equal in every way to the capital "D" export.

### Timestamp constructor validation

The `Timestamp` type no longer accepts two number arguments for the low and high bits of the `int64` value.

Supported constructors are as follows:

```typescript
class Timestamp {
  constructor(int: bigint);
  constructor(long: Long);
  constructor(value: { t: number; i: number });
}
```

Any code that uses the two number argument style of constructing a `Timestamp` will need to be migrated to one of the supported constructors. We recommend using the `{ t: number; i: number }` style input, representing the timestamp and increment respectively.

```typescript
// in 4.x BSON
new Timestamp(1, 2); // as an int64: 8589934593
// in 5.x BSON
new Timestamp({ t: 2, i: 1 }); // as an int64: 8589934593
```

Additionally, the `t` and `i` fields of `{ t: number; i: number }` are now validated more strictly to ensure your timestamps are being constructed as expected.

For example:
```typescript
new Timestamp({ t: -2, i: 1 });
// Will throw, both fields need to be positive
new Timestamp({ t: 2, i: 0xFFFF_FFFF + 1 });
// Will throw, both fields need to be less than or equal to the unsigned int32 max value
```

### Extended JSON `strict` flag removed

Extended JSON `parse` and `stringify` APIs no longer support the `strict` option, please use the `relaxed` option instead.

**Note** that the `relaxed` setting is the inverse of `strict`. See the following migration example:

```typescript
// parse
EJSON.parse("...",  { strict: true  }); /* migrate to */ EJSON.parse("...",  { relaxed: false });
EJSON.parse("...",  { strict: false }); /* migrate to */ EJSON.parse("...",  { relaxed: true });
// stringify
EJSON.stringify({}, { strict: true  }); /* migrate to */ EJSON.stringify({}, { relaxed: false });
EJSON.stringify({}, { strict: false }); /* migrate to */ EJSON.stringify({}, { relaxed: true });
```

### The BSON default export has been removed.

* If you import BSON `commonjs` style `const BSON = require('bson')` then the `BSON.default` property is no longer present.
* If you import BSON `esmodule` style `import BSON from 'bson'` then this code will crash upon loading.
  * This error will throw: `SyntaxError: The requested module 'bson' does not provide an export named 'default'`.

### `class Code` always converts `.code` to string

The `Code` class still supports the same constructor arguments as before.
It will now convert the first argument to a string before saving it to the code property, see the following:

```typescript
const myCode = new Code(function iLoveJavascript() { console.log('I love javascript') });
// myCode.code === "function iLoveJavascript() { console.log('I love javascript') }"
// typeof myCode.code === 'string'
```

### `BSON.deserialize()` only returns `Code` instances

The deserialize options: `evalFunctions`, `cacheFunctions`, and `cacheFunctionsCrc32` have been removed.
The `evalFunctions` option, when enabled, would return BSON `Code` typed values as eval-ed JavaScript functions, now it will always return `Code` instances.

See the following snippet for how to migrate:

```typescript
const bsonBytes = BSON.serialize(
  { iLoveJavascript: function () { console.log('I love javascript') } },
  { serializeFunctions: true } // serializeFunctions still works!
);
const result = BSON.deserialize(bsonBytes)
// result.iLoveJavascript instanceof Code
// result.iLoveJavascript.code === "function () { console.log('I love javascript') }"
const iLoveJavascript = new Function(`return ${result.iLoveJavascript.code}`)();
iLoveJavascript();
// prints "I love javascript"
// iLoveJavascript.name === "iLoveJavascript"
```

### `BSON.serialize()` validation

The BSON format does not support encoding arrays as the **root** object.
However, in JavaScript arrays are just objects where the keys are numeric (and a magic `length` property), so round tripping an array (ex. `[1, 2]`) though BSON would return `{ '0': 1, '1': 2 }`.

`BSON.serialize()` now validates input types, the input to serialize must be an object or a `Map`, arrays will now cause an error.

```typescript
BSON.serialize([1, 2, 3])
// BSONError: serialize does not support an array as the root input
```

If the functionality of turning arrays into an object with numeric keys is useful, see the following example:

```typescript
// Migration example:
const result = BSON.serialize(Object.fromEntries([1, true, 'blue'].entries()))
BSON.deserialize(result)
// { '0': 1, '1': true, '2': 'blue' }
```

### Exports and available bundles

Most users should be unaffected by these changes, Node.js `require()` / Node.js `import` will fetch the corresponding BSON library as expected.
And for folks using bundlers like, webpack or rollup a tree shakable ES module bundle will be pulled in because of the settings in our `package.json`.

Our `package.json` defines the following `"exports"` settings.
```json
{
  "main": "./lib/bson.cjs",
  "module": "./lib/bson.mjs",
  "browser": "./lib/bson.mjs",
  "exports": {
    "browser": "./lib/bson.mjs",
    "import": "./lib/bson.mjs",
    "require": "./lib/bson.cjs"
  }
}
```

You can now find compiled bundles of the BSON library in 3 common formats in the `lib` directory.

- CommonJS - `lib/bson.cjs`
- ES Module - `lib/bson.mjs`
- Immediate Invoked Function Expression (IIFE) - `lib/bson.bundle.js`
  - Typically used when trying to import JS on the web CDN style, but the ES Module (`.mjs`) bundle is fully browser compatible and should be preferred if it works in your use case.

### `BSONTypeError` removed and `BSONError` offers filtering functionality with `static isBSONError()`

`BSONTypeError` has been removed because it was not a subclass of BSONError so would not return true for an `instanceof` check against `BSONError`. To learn more about our expectations of error handling see [this section of the MongoDB Node.js Driver's README](https://github.com/mongodb/node-mongodb-native/tree/main#error-handling).


A `BSONError` can be thrown from deep within a library that relies on BSON, having one error super class for the library helps with programmatic filtering of an error's origin.

Since BSON can be used in environments where instances may originate from across realms, `BSONError` has a static `isBSONError()` method that helps with determining if an object is a `BSONError` instance (much like [Array.isArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)).

It is our recommendation to use `isBSONError()` checks on errors and to avoid relying on parsing `error.message` and `error.name` strings in your code. We guarantee `isBSONError()` checks will pass according to semver guidelines, but errors may be sub-classed or their messages may change at any time, even patch releases, as we see fit to increase the helpfulness of the errors.

Hypothetical example: A collection in our database contains invalid UTF-8 data:
```ts
let documentCount = 0;
const cursor = collection.find({}, { utf8Validation: true });
try {
  for await (const doc of cursor) documentCount += 1;
} catch (error) {
  if (BSONError.isBSONError(error)) {
    console.log(`Found the troublemaker UTF-8!: ${documentCount} ${error.message}`);
    return documentCount;
  }
  throw error;
}
```

### Explicit cross version incompatibility

Starting with v5.0.0 of the BSON library instances of types from previous versions will throw an error when passed to the serializer. This is to ensure that types are always serialized correctly and that there is no unexpected silent BSON serialization mistakes that could occur when mixing versions.

It's unexpected for any applications to have more than one version of the BSON library but with nested dependencies and re-exporting, this new error will illuminate those incorrect combinations.

```ts
// npm install bson4@npm:bson@4
// npm install bson5@npm:bson@5
import { ObjectId } from 'bson4';
import { serialize } from 'bson5';

serialize({ _id: new ObjectId() });
// Uncaught BSONVersionError: Unsupported BSON version, bson types must be from bson 5.0 or later
```
