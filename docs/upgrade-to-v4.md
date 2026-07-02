# Upgrade to v4

The latest release of `bson` represents the first major refactoring of the module, and introduces a
number of breaking changes. The following guide lists these changes, and hopes to aid migration and
adoption.

## Changelog

You can view the [Changelog](https://github.com/mongodb/js-bson/blob/master/HISTORY.md) for a
detailed list of the changes in this release.

## Breaking Changes

### Node

This module now requires Node.js v6 or above, because we are using ES2015 features in non-transpiled code, and lesser versions are deprecated.

### BSON

* The module no longer exports a `BSON` type to be instantiated. Instead it exports a namespace, similar to `JSON`:

  **Old**
  ```js
    const BSON = require('bson');
    const Long = BSON.Long;
    const bson = new BSON();

    const doc = { long: Long.fromNumber(100) };
    const data = bson.serialize(doc);
  ```

  **New**
  ```js
    const BSON = require('bson');
    const Long = BSON.Long;

    const doc = { long: Long.fromNumber(100) };
    const data = BSON.serialize(doc);
  ```

* The `Symbol` type has been renamed `BSONSymbol` to avoid conflicts with the ES6 `Symbol`

* All types have been converted to ES6 classes, and no longer maintain circular references to
themelves. e.g. `BSON.Timestamp` no longer has a `BSON.Timestamp.Timestamp` property.

* The `_bsontype` property of all known types is now a non-enumerable property

* Our `Long` type is now backed by an imported `Long.js` dependency

### Extended JSON

* The MongoDB [Extended JSON](https://github.com/mongodb-js/mongodb-extjson) module has been merged with bson. You can access it like so:

  ```js
    const {EJSON} = require('bson');

    // prints '{"int32":{"$numberInt":"10"}}'
    console.log(EJSON.stringify({ a: 42 }));

    // prints { int32: { [String: '10'] _bsontype: 'Int32', value: '10' } }
    console.log(EJSON.parse('{"int32":{"$numberInt":"10"}}'));
  ```

* Strict mode has been deprecated in favor of `relaxed` mode, keeping in line with the Extended JSON specification.

* Doubles are now deserialized as `Number` when in `relaxed` (`strict: false`) mode
