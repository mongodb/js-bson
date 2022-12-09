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

If serializeFunctions was enabled and the functions being serialized had a name that is outside of [Controls and Basic Latin](https://en.wikibooks.org/wiki/Unicode/Character_reference/0000-0FFF) character ranges (a.k.a utf8 bytes: 0x00-0x7F) they would be incorrectly serialized.

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

### Capital "D" ObjectID export removed

For clarity the deprecated and duplicate export `ObjectID` has been removed. `ObjectId` matches the class name and is equal in every way to the capital "D" export.

### Timestamp constructor validation

The `Timestamp` type no longer accepts two number arguments for the low and high bits of the int64 value.

Supported constructors are as follows:

```typescript
class Timestamp {
  constructor(int: bigint);
  constructor(long: Long);
  constructor(value: { t: number; i: number });
}
```

Any code that use the two number argument style of constructing a Timestamp will need to be migrated to one of the supported constructors. We recommend using the `{ t: number; i: number }` style input, representing the timestamp and increment respectively.

```typescript
// in 4.x BSON
new Timestamp(1, 2); // as an int64: 8589934593
// in 5.x BSON
new Timestamp({ t: 2, i: 1 }); // as an int64: 8589934593
```

Additionally, the `t` and `i` fields of `{ t: number; i: number }` are now validated more strictly to ensure your Timestamps are being constructed as expected.

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

### The BSON default export has been removed.

* If you import BSON commonjs style `const BSON = require('bson')` then the `BSON.default` property is no longer present.
* If you import BSON esmodule style `import BSON from 'bson'` then this code will crash upon loading. **TODO: This is not the case right now but it will be after NODE-4713.**
  * This error will throw: `SyntaxError: The requested module 'bson' does not provide an export named 'default'`.
