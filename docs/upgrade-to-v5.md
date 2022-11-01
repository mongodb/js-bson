# Changes in v5

## About

The following is a detailed collection of the changes in the major v5 release of the bson package
for nodejs and web platforms.

<!--
1. a brief statement of what is breaking (brief as in "x will now return y instead of z", or "x is no longer supported, use y instead", etc
2. a brief statement of why we are breaking it (bug, not useful, inconsistent behavior, better alternative, etc)
3. if applicable, an example of suggested syntax change (can be included in (1) )
-->

### Remove reliance on Node.js Buffer

> **TL;DR**: Web environments return Uint8Array; Node.js environments return Buffer

For those that use the BSON library on Node.js, there is no change the BSON APIs will still return and accept instances of Node.js Buffer. Since we no longer depend on the Buffer web shim for compatibility with browsers, in non-Node.js environments a Uint8Array will be returned instead.

This allows the BSON library to be better at platform independence while keeping its behavior consistent cross platform. The Buffer shim served the library well but brought in more than was necessary for the concerns of the code here.

### `ObjectId.toString` / `UUID.toString` / `Binary.toString`

> **TL;DR**: These `toString` methods only support the following encodings: 'hex', 'base64', 'utf8'

The methods: `ObjectId.toString`, `UUID.toString`, and `Binary.toString` took encodings that were passed through to the Node.js Buffer API. As a result of no longer relying on the presence of `Buffer` we can no longer support every encoding that Node.js did. We continue to support `'hex'` and `'base64'` on all three methods and additionally `'utf-8' | 'utf8'` on `Binary.toString`. If any of the other encodings are desired the underlying buffer for all these classes are publicly accessible and while in Node.js will be stored as a Node.js buffer:

```typescript
const oid = new ObjectId();
oid.id.toString('utf16le') // Returns string interpreting the bytes as 'utf16le'
```

### `serializeFunctions` bug fix

> **TL;DR**: TODO

TODO(NODE-4771): serializeFunctions bug fix makes function names outside the ascii range get serialized correctly
