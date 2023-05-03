# BSON parser

BSON is short for "Binary JSON," and is the binary-encoded serialization of JSON-like documents.
You can learn more about it in [the specification](http://bsonspec.org).

### Table of Contents
- [Usage](#usage)
- [Bugs/Feature Requests](#bugs--feature-requests)
- [Installation](#installation)
- [Documentation](#documentation)
- [FAQ](#faq)

## Bugs / Feature Requests

Think you've found a bug? Want to see a new feature in `bson`? Please open a case in our issue management tool, JIRA:

1. Create an account and login: [jira.mongodb.org](https://jira.mongodb.org)
2. Navigate to the NODE project: [jira.mongodb.org/browse/NODE](https://jira.mongodb.org/browse/NODE)
3. Click **Create Issue** - Please provide as much information as possible about the issue and how to reproduce it.

Bug reports in JIRA for all driver projects (i.e. NODE, PYTHON, CSHARP, JAVA) and the Core Server (i.e. SERVER) project are **public**.

## Usage

To build a new version perform the following operations:

```
npm install
npm run build
```

### Node.js or Bundling Usage

When using a bundler or Node.js you can import bson using the package name:

```js
import { BSON, EJSON, ObjectId } from 'bson';
// or:
// const { BSON, EJSON, ObjectId } = require('bson');

const bytes = BSON.serialize({ _id: new ObjectId() });
console.log(bytes);
const doc = BSON.deserialize(bytes);
console.log(EJSON.stringify(doc));
// {"_id":{"$oid":"..."}}
```

### Browser Usage

If you are working directly in the browser without a bundler please use the `.mjs` bundle like so:

```html
<script type="module">
  import { BSON, EJSON, ObjectId } from './lib/bson.mjs';

  const bytes = BSON.serialize({ _id: new ObjectId() });
  console.log(bytes);
  const doc = BSON.deserialize(bytes);
  console.log(EJSON.stringify(doc));
  // {"_id":{"$oid":"..."}}
</script>
```

## Installation

```sh
npm install bson
```

## Documentation

[API documentation](https://mongodb.github.io/node-mongodb-native/Next/modules/BSON.html)

## Error Handling

It is our recommendation to use `BSONError.isBSONError()` checks on errors and to avoid relying on parsing `error.message` and `error.name` strings in your code. We guarantee `BSONError.isBSONError()` checks will pass according to semver guidelines, but errors may be sub-classed or their messages may change at any time, even patch releases, as we see fit to increase the helpfulness of the errors.

Any new errors we add to the driver will directly extend an existing error class and no existing error will be moved to a different parent class outside of a major release.
This means `BSONError.isBSONError()` will always be able to accurately capture the errors that our BSON library throws.

Hypothetical example: A collection in our Db has an issue with UTF-8 data:

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

## React Native

BSON requires that `TextEncoder`, `TextDecoder`, `atob`, `btoa`, and `crypto.getRandomValues` are available globally.  These are present in most Javascript runtimes but require polyfilling in React Native.  Polyfills for the missing functionality can be installed with the following command:
```sh
npm install --save react-native-get-random-values text-encoding-polyfill base-64
```

The following snippet should be placed at the top of the entrypoint (by default this is the root `index.js` file) for React Native projects using the BSON library.  These lines must be placed for any code that imports `BSON`.

```typescript
// Required Polyfills For ReactNative
import {encode, decode} from 'base-64';
if (global.btoa == null) {
  global.btoa = encode;
}
if (global.atob == null) {
  global.atob = decode;
}
import 'text-encoding-polyfill';
import 'react-native-get-random-values';
```

Finally, import the `BSON` library like so:

```typescript
import { BSON, EJSON } from 'bson';
```

This will cause React Native to import the `node_modules/bson/lib/bson.cjs` bundle (see the `"react-native"` setting we have in the `"exports"` section of our [package.json](./package.json).)

### Technical Note about React Native module import

The `"exports"` definition in our `package.json` will result in BSON's CommonJS bundle being imported in a React Native project instead of the ES module bundle.  Importing the CommonJS bundle is necessary because BSON's ES module bundle of BSON uses top-level await, which is not supported syntax in [React Native's runtime hermes](https://hermesengine.dev/).

## FAQ

#### Why does `undefined` get converted to `null`?

The `undefined` BSON type has been [deprecated for many years](http://bsonspec.org/spec.html), so this library has dropped support for it. Use the `ignoreUndefined` option (for example, from the [driver](http://mongodb.github.io/node-mongodb-native/2.2/api/MongoClient.html#connect) ) to instead remove `undefined` keys.

#### How do I add custom serialization logic?

This library looks for `toBSON()` functions on every path, and calls the `toBSON()` function to get the value to serialize.

```javascript
const BSON = require('bson');

class CustomSerialize {
  toBSON() {
    return 42;
  }
}

const obj = { answer: new CustomSerialize() };
// "{ answer: 42 }"
console.log(BSON.deserialize(BSON.serialize(obj)));
```
