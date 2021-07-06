# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [4.4.1](https://github.com/mongodb/js-bson/compare/v4.4.0...v4.4.1) (2021-07-06)


### Bug Fixes

* **NODE-3247:** DBRef special handling ([#443](https://github.com/mongodb/js-bson/issues/443)) ([f5d984d](https://github.com/mongodb/js-bson/commit/f5d984d88b2e20310ec5cc3a39b91b0fd1e0b3c9))
* **NODE-3282:** BSONRegExp options not alphabetized ([#441](https://github.com/mongodb/js-bson/issues/441)) ([18c3512](https://github.com/mongodb/js-bson/commit/18c3512befe54908e4b816056dbde0d1b998d81b))
* **NODE-3376:** use standard JS methods for copying Buffers ([#444](https://github.com/mongodb/js-bson/issues/444)) ([804050d](https://github.com/mongodb/js-bson/commit/804050d40b03a02116995e63671e05ffa033dc45))
* **NODE-3390:** serialize non-finite doubles correctly in EJSON ([#445](https://github.com/mongodb/js-bson/issues/445)) ([7eb7998](https://github.com/mongodb/js-bson/commit/7eb79981e16d73a391c567b7f9748943997a424d))

## [4.4.0](https://github.com/mongodb/js-bson/compare/v4.3.0...v4.4.0) (2021-05-18)


### Features

* **NODE-3264:** allow Decimal128(string), Long(string), Long(bigint) ([#437](https://github.com/mongodb/js-bson/issues/437)) ([392c1bc](https://github.com/mongodb/js-bson/commit/392c1bcbe003b185f38d64a8a24bc21a6661cb26))
* make circular input errors for EJSON expressive ([#433](https://github.com/mongodb/js-bson/issues/433)) ([7b351cc](https://github.com/mongodb/js-bson/commit/7b351cc217786e5ee992f0fb64588f9c3fddd828))


### Bug Fixes

* make Long inspect result evaluable ([3a2eff1](https://github.com/mongodb/js-bson/commit/3a2eff127175c7f94c9ccc940074537b7ad972f1))
* **NODE-3153:** correctly deserialize `__proto__` properties ([#431](https://github.com/mongodb/js-bson/issues/431)) ([f34cabc](https://github.com/mongodb/js-bson/commit/f34cabc31e66bc809d8e3cc6b0d203739f40aa41))
* accept Uint8Array where Buffer is accepted ([#432](https://github.com/mongodb/js-bson/issues/432)) ([4613763](https://github.com/mongodb/js-bson/commit/46137636ac8e59010ba3bfdd317d5d13d9d3066d))
* clean up instanceof usage ([9b6d52a](https://github.com/mongodb/js-bson/commit/9b6d52a84a20641b22732355e56c3bae3fe857f1))
* improve ArrayBuffer brand check in ensureBuffer ([#429](https://github.com/mongodb/js-bson/issues/429)) ([99722f6](https://github.com/mongodb/js-bson/commit/99722f66d9f5eeb0ab57e74bab26049a425fa3e8))

## [4.3.0](https://github.com/mongodb/js-bson/compare/v4.2.3...v4.3.0) (2021-04-06)


### Features

* UUID convenience class ([#425](https://github.com/mongodb/js-bson/issues/425)) ([76e1826](https://github.com/mongodb/js-bson/commit/76e1826eed852d4cca9fafabbcf826af1367c9af))

### [4.2.3](https://github.com/mongodb/js-bson/compare/v4.2.2...v4.2.3) (2021-03-02)


### Bug Fixes

* allow library to be loaded in web workeds ([#423](https://github.com/mongodb/js-bson/issues/423)) ([023f57e](https://github.com/mongodb/js-bson/commit/5ae057d3c6dd87e1407dcdc7b8d9da668023f57e))

* make inspection result of BSON types evaluable ([#416](https://github.com/mongodb/js-bson/issues/416)) ([616665f](https://github.com/mongodb/js-bson/commit/616665f5e6f7dd06a88de450aaccaa203fa6c652))
* permit BSON types to be created without new ([#424](https://github.com/mongodb/js-bson/issues/424)) ([d2bc284](https://github.com/mongodb/js-bson/commit/d2bc284943649ac27116701a4ed91ff731a4bdf7))

### [4.2.2](https://github.com/mongodb/js-bson/compare/v4.2.1...v4.2.2) (2020-12-01)


### Bug Fixes

* remove tslib usage and fix Long method alias ([#415](https://github.com/mongodb/js-bson/issues/415)) ([2d9a8e6](https://github.com/mongodb/js-bson/commit/2d9a8e678417ec43a0b82377743ab9c30a3c3b6b))

### [4.2.1](https://github.com/mongodb/js-bson/compare/v4.2.0...v4.2.1) (2020-12-01)


### Bug Fixes

* backwards compatibility with older BSON package versions ([#411](https://github.com/mongodb/js-bson/issues/411)) ([5167be2](https://github.com/mongodb/js-bson/commit/5167be2752369d5832057f7b69da0e240ed4c204))
* Downlevel type definitions ([#410](https://github.com/mongodb/js-bson/issues/410)) ([203402f](https://github.com/mongodb/js-bson/commit/203402f5cd9dd496a4103dc1008bad382d3c69c4))
* make inspect method for ObjectId work ([#412](https://github.com/mongodb/js-bson/issues/412)) ([a585a0c](https://github.com/mongodb/js-bson/commit/a585a0cf8cd1212617fb8f37581194e6c31e33fa))
* remove stringify overloads ([2df6b42](https://github.com/mongodb/js-bson/commit/2df6b42de4cbf81a307d2db144d15470d543976e))

## [4.2.0](https://github.com/mongodb/js-bson/compare/v4.1.0...v4.2.0) (2020-10-13)


### Features

* add extended json parsing for $uuid ([b1b2a0e](https://github.com/mongodb/js-bson/commit/b1b2a0ee5f497c971aa28961cf80bde522fc1779))
* convert to TypeScript ([#393](https://github.com/mongodb/js-bson/issues/393)) ([9aad874](https://github.com/mongodb/js-bson/commit/9aad8746bbb2159012193a53a206509130a95fb0))
* Improve TS Typings ([#389](https://github.com/mongodb/js-bson/issues/389)) ([ae9ae2d](https://github.com/mongodb/js-bson/commit/ae9ae2df0d5d0a88adf27523d7fca7f3ad59a57a))


### Bug Fixes

* adds interfaces for EJSON objects ([7f5f1a3](https://github.com/mongodb/js-bson/commit/7f5f1a38d99d1d50b8bf261cc72916f5bce506ae))
* Correct API Extractor config to omit definition file from dist ([#407](https://github.com/mongodb/js-bson/issues/407)) ([ace8647](https://github.com/mongodb/js-bson/commit/ace8647646e20df61e77d0ce8ed7ea84a3ff7738))
* coverage ([992e2e0](https://github.com/mongodb/js-bson/commit/992e2e040806701d1c69e09d07186a6e1deacc0e))
* deprecate cacheFunctionsCrc32 ([ea83bf5](https://github.com/mongodb/js-bson/commit/ea83bf5200f4a936692f710063941ba802386da4))
* Rework rollup config to output named and default exports ([#404](https://github.com/mongodb/js-bson/issues/404)) ([a48676b](https://github.com/mongodb/js-bson/commit/a48676b0d442e06a71a413500194d35a7bea7587))
* Throw on BigInt type values ([#397](https://github.com/mongodb/js-bson/issues/397)) ([2dd54e5](https://github.com/mongodb/js-bson/commit/2dd54e5275fc72dd8cd579a1636d2a73b7b0e790))
* type issues with SerializeOptions and Long methods accepting Timestamp ([c18ba71](https://github.com/mongodb/js-bson/commit/c18ba71229129c8ea34e40265a9503c10e29a9e0))

<a name="4.1.0"></a>
# [4.1.0](https://github.com/mongodb/js-bson/compare/v4.0.4...v4.1.0) (2020-08-10)


### Bug Fixes

* spelling in deserializer errors ([4c6f2e4](https://github.com/mongodb/js-bson/commit/4c6f2e4))
* **object-id:** harden the duck-typing ([4b800ae](https://github.com/mongodb/js-bson/commit/4b800ae))
* parse value of Int32 in constructor ([5cda40f](https://github.com/mongodb/js-bson/commit/5cda40f))
* Reduce floating point precision required of extended json implementations ([#369](https://github.com/mongodb/js-bson/issues/369)) ([5e35d1a](https://github.com/mongodb/js-bson/commit/5e35d1a))


### Features

* add support for primitives to EJSON.stringify ([329857d](https://github.com/mongodb/js-bson/commit/329857d))



<a name="4.0.4"></a>
## [4.0.4](https://github.com/mongodb/js-bson/compare/v4.0.3...v4.0.4) (2020-03-26)


### Bug Fixes

* improve EJSON generation for previously skipped edge cases ([30f5a8f](https://github.com/mongodb/js-bson/commit/30f5a8f))
* only upgrade `symbol` to `string` if `promoteValues` is true ([067a7ba](https://github.com/mongodb/js-bson/commit/067a7ba))



<a name="4.0.3"></a>
## [4.0.3](https://github.com/mongodb/js-bson/compare/v4.0.2...v4.0.3) (2020-01-09)


### Bug Fixes

* support Number object in Int32 and Double constructors ([fe3f0dc](https://github.com/mongodb/js-bson/commit/fe3f0dc))
* **Timestamp:** make sure timestamp is always unsigned ([36b2d43](https://github.com/mongodb/js-bson/commit/36b2d43))



<a name="4.0.2"></a>
## [4.0.2](https://github.com/mongodb/js-bson/compare/v4.0.0...v4.0.2) (2019-03-08)


### Bug Fixes

* **buffer:** don't use deprecated Buffer constructors ([7bb9c57](https://github.com/mongodb/js-bson/commit/7bb9c57))
* **Buffer:** import buffer for binary, decimal128, and fnv1a ([6be7b8d](https://github.com/mongodb/js-bson/commit/6be7b8d))
* **ejson:** enable serialization of legacy `ObjectID` ([ba98ccb](https://github.com/mongodb/js-bson/commit/ba98ccb)), closes [#303](https://github.com/mongodb/js-bson/issues/303)
* **ejson:** support array for replacer parameter in `EJSON.stringify` ([9f43809](https://github.com/mongodb/js-bson/commit/9f43809)), closes [#303](https://github.com/mongodb/js-bson/issues/303) [#302](https://github.com/mongodb/js-bson/issues/302) [#303](https://github.com/mongodb/js-bson/issues/303)
* **ejson-serialize:** prevent double serialization for nested documents ([ab790c9](https://github.com/mongodb/js-bson/commit/ab790c9)), closes [#303](https://github.com/mongodb/js-bson/issues/303)
* **object-id:** correct serialization of old ObjectID types ([8d57a8c](https://github.com/mongodb/js-bson/commit/8d57a8c))
* **timestamp:** getTimestamp support times beyond 2038 ([a0820d5](https://github.com/mongodb/js-bson/commit/a0820d5))
* 4.x-1.x interop (incl. ObjectID _bsontype) ([f4b16d9](https://github.com/mongodb/js-bson/commit/f4b16d9))



<a name="4.0.1"></a>
## [4.0.1](https://github.com/mongodb/js-bson/compare/v4.0.0...v4.0.1) (2018-12-06)


### Bug Fixes

* **object-id:** correct serialization of old ObjectID types ([8d57a8c](https://github.com/mongodb/js-bson/commit/8d57a8c))



<a name="4.0.0"></a>
# [4.0.0](https://github.com/mongodb/js-bson/compare/v3.0.2...v4.0.0) (2018-11-13)

### Migration Guide

Please see the [migration guide](https://github.com/mongodb/js-bson/blob/master/docs/upgrade-to-v4.md) for detailed discussion of breaking changes in this release.

### Bug Fixes

* **buffer:** replace deprecated Buffer constructor ([5acdebf](https://github.com/mongodb/js-bson/commit/5acdebf))
* **dbPointer:** fix utf8 bug for dbPointer ([018c769](https://github.com/mongodb/js-bson/commit/018c769))
* **deserialize:** fix deserialization of 0xFFFD ([c682ae3](https://github.com/mongodb/js-bson/commit/c682ae3)), closes [#277](https://github.com/mongodb/js-bson/issues/277)
* **ext-json:** deserialize doubles as `Number` in relaxed mode ([a767fa1](https://github.com/mongodb/js-bson/commit/a767fa1))
* **ObjectId:** will now throw if an invalid character is passed ([6f30b4e](https://github.com/mongodb/js-bson/commit/6f30b4e))
* **ObjectID:** ObjectId.isValid should check buffer length ([06af813](https://github.com/mongodb/js-bson/commit/06af813))
* **package:** `browser` section needs to point to correct index ([08337e3](https://github.com/mongodb/js-bson/commit/08337e3))
* **random-bytes:** fallback to insecure path if require is null ([963b12b](https://github.com/mongodb/js-bson/commit/963b12b))
* **random-bytes:** wrap crypto require in try/catch for fallback ([47fd5f7](https://github.com/mongodb/js-bson/commit/47fd5f7))
* **serializer:** do not use checkKeys for $clusterTime ([cbb4724](https://github.com/mongodb/js-bson/commit/cbb4724))
* **serializer:** map insert expects only string keys ([aba3a18](https://github.com/mongodb/js-bson/commit/aba3a18))


### Code Refactoring

* **symbol:** rename Symbol to BSONSymbol ([5d5b3d2](https://github.com/mongodb/js-bson/commit/5d5b3d2))


### Features

* **BSON:** simplify and flatten module exports ([f8920c6](https://github.com/mongodb/js-bson/commit/f8920c6))
* **bsontype:** move all `_bsontypes` to non-enumerable properties ([16f5bf6](https://github.com/mongodb/js-bson/commit/16f5bf6))
* **ext-json:** add extended JSON codecs directly to BSON types ([10e5f00](https://github.com/mongodb/js-bson/commit/10e5f00))
* **ext-json:** add extended JSON support to the bson library ([d6b71ab](https://github.com/mongodb/js-bson/commit/d6b71ab))
* **ext-json:** export EJSON at top level of module ([c356a5a](https://github.com/mongodb/js-bson/commit/c356a5a))
* **karma:** test bson in the browser ([cd593ca](https://github.com/mongodb/js-bson/commit/cd593ca))
* **long:** replace long implementatin with long.js ([545900d](https://github.com/mongodb/js-bson/commit/545900d))


### BREAKING CHANGES

* **ObjectId:** Where code was previously silently erroring, users may now
experience TypeErrors
* **symbol:** This was conflicting with the ES6 Symbol type



<a name="3.0.2"></a>
## [3.0.2](https://github.com/mongodb/js-bson/compare/v3.0.1...v3.0.2) (2018-07-13)


### Bug Fixes

* **revert:** Reverting v3.0.1 ([efb0720](https://github.com/mongodb/js-bson/commit/efb0720))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/mongodb/js-bson/compare/v2.0.8...v3.0.0) (2018-06-13)


### Features

* **ObjectID:** use FNV-1a hash for objectId ([4f545b1](https://github.com/mongodb/js-bson/commit/4f545b1))
* **rollup:** initial commit of rollup-generated bundle ([474b8f7](https://github.com/mongodb/js-bson/commit/474b8f7))
* **rollup:** switch from webpack to rollup for bundling ([98068fa](https://github.com/mongodb/js-bson/commit/98068fa))



<a name="2.0.8"></a>
## [2.0.8](https://github.com/mongodb/js-bson/compare/v2.0.7...v2.0.8) (2018-06-06)


### Bug Fixes

* **readme:** clarify documentation about deserialize methods ([e311056](https://github.com/mongodb/js-bson/commit/e311056))
* **serialization:** normalize function stringification ([21eb0b0](https://github.com/mongodb/js-bson/commit/21eb0b0))



<a name="2.0.7"></a>
## [2.0.7](https://github.com/mongodb/js-bson/compare/v2.0.6...v2.0.7) (2018-05-31)


### Bug Fixes

* **binary:** add type checking for buffer ([cbfb25d](https://github.com/mongodb/js-bson/commit/cbfb25d))



<a name="2.0.6"></a>
## [2.0.6](https://github.com/mongodb/js-bson/compare/v2.0.5...v2.0.6) (2018-04-27)


### Bug Fixes

* **deserializeStream:** allow multiple documents to be deserialized ([6fc5984](https://github.com/mongodb/js-bson/commit/6fc5984)), closes [#244](https://github.com/mongodb/js-bson/issues/244)



<a name="2.0.5"></a>
## [2.0.5](https://github.com/mongodb/js-bson/compare/v2.0.4...v2.0.5) (2018-04-06)


### Bug Fixes

* **regexp:** properly construct new BSONRegExp when constructor called without new ([#242](https://github.com/mongodb/js-bson/issues/242)) ([93ae799](https://github.com/mongodb/js-bson/commit/93ae799))



<a name="2.0.4"></a>
## [2.0.4](https://github.com/mongodb/js-bson/compare/v2.0.3...v2.0.4) (2018-03-12)



<a name="2.0.3"></a>
## [2.0.3](https://github.com/mongodb/js-bson/compare/v2.0.2...v2.0.3) (2018-03-12)


### Features

* **serialization:** support arbitrary sizes for the internal serialization buffer ([a6bd45c](https://github.com/mongodb/js-bson/commit/a6bd45c))



<a name="2.0.2"></a>
## [2.0.2](https://github.com/mongodb/js-bson/compare/v2.0.1...v2.0.2) (2018-03-02)


### Bug Fixes

* make sure all functions are named consistently ([6df9022](https://github.com/mongodb/js-bson/commit/6df9022))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/mongodb/js-bson/compare/v2.0.0...v2.0.1) (2018-02-28)


### Bug Fixes

* **serializer:** ensure RegExp options are alphabetically sorted ([d60659d](https://github.com/mongodb/js-bson/commit/d60659d))


### Features

* **db-ref:** support passing a namespace into a DBRef ctor ([604831b](https://github.com/mongodb/js-bson/commit/604831b))



<a name="2.0.0"></a>
# 2.0.0 (2018-02-26)


### Bug Fixes

* **browser:** fixing browser property in package.json ([095fba9](https://github.com/mongodb/js-bson/commit/095fba9))
* **dbref:** only upgrade objects with allowed $keys to DBRefs ([98eb9e2](https://github.com/mongodb/js-bson/commit/98eb9e2))
* **decimal128:** add basic guard against REDOS attacks ([511ecc4](https://github.com/mongodb/js-bson/commit/511ecc4))
* **Decimal128:** update toString and fromString methods to correctly handle the case of too many significant digits ([25ed43e](https://github.com/mongodb/js-bson/commit/25ed43e))
* **objectid:** if pid is 1, use random value ([e188ae6](https://github.com/mongodb/js-bson/commit/e188ae6))
* **serializeWithBufferAndIndex:** write documents to start of intermediate buffer ([b4e4ac5](https://github.com/mongodb/js-bson/commit/b4e4ac5))



1.0.4 2016-01-11
----------------
- #204 remove Buffer.from as it's partially broken in early 4.x.x. series of node releases.

1.0.3 2016-01-03
----------------
- Fixed toString for ObjectId so it will work with inspect.

1.0.2 2016-01-02
----------------
- Minor optimizations for ObjectID to use Buffer.from where available.

1.0.1 2016-12-06
----------------
- Reverse behavior for undefined to be serialized as NULL. MongoDB 3.4 does not allow for undefined comparisons.

1.0.0 2016-12-06
----------------
- Introduced new BSON API and documentation.

0.5.7 2016-11-18
-----------------
- NODE-848 BSON Regex flags must be alphabetically ordered.

0.5.6 2016-10-19
-----------------
- NODE-833, Detects cyclic dependencies in documents and throws error if one is found.
- Fix(deserializer): corrected the check for (size + index) comparison… (Issue #195, https://github.com/JoelParke).

0.5.5 2016-09-15
-----------------
- Added DBPointer up conversion to DBRef

0.5.4 2016-08-23
-----------------
- Added promoteValues flag (default to true) allowing user to specify if deserialization should be into wrapper classes only.

0.5.3 2016-07-11
-----------------
- Throw error if ObjectId is not a string or a buffer.

0.5.2 2016-07-11
-----------------
- All values encoded big-endian style for ObjectId.

0.5.1 2016-07-11
-----------------
- Fixed encoding/decoding issue in ObjectId timestamp generation.
- Removed BinaryParser dependency from the serializer/deserializer.

0.5.0 2016-07-05
-----------------
- Added Decimal128 type and extended test suite to include entire bson corpus.

0.4.23 2016-04-08
-----------------
- Allow for proper detection of ObjectId or objects that look like ObjectId, improving compatibility across third party libraries.
- Remove one package from dependency due to having been pulled from NPM.

0.4.22 2016-03-04
-----------------
- Fix "TypeError: data.copy is not a function" in Electron (Issue #170, https://github.com/kangas).
- Fixed issue with undefined type on deserializing.

0.4.21 2016-01-12
-----------------
- Minor optimizations to avoid non needed object creation.

0.4.20 2015-10-15
-----------------
- Added bower file to repository.
- Fixed browser pid sometimes set greater than 0xFFFF on browsers (Issue #155, https://github.com/rahatarmanahmed)

0.4.19 2015-10-15
-----------------
- Remove all support for bson-ext.

0.4.18 2015-10-15
-----------------
- ObjectID equality check should return boolean instead of throwing exception for invalid oid string #139
- add option for deserializing binary into Buffer object #116

0.4.17 2015-10-15
-----------------
- Validate regexp string for null bytes and throw if there is one.

0.4.16 2015-10-07
-----------------
- Fixed issue with return statement in Map.js.

0.4.15 2015-10-06
-----------------
- Exposed Map correctly via index.js file.

0.4.14 2015-10-06
-----------------
- Exposed Map correctly via bson.js file.

0.4.13 2015-10-06
-----------------
- Added ES6 Map type serialization as well as a polyfill for ES5.

0.4.12 2015-09-18
-----------------
- Made ignore undefined an optional parameter.

0.4.11 2015-08-06
-----------------
- Minor fix for invalid key checking.

0.4.10 2015-08-06
-----------------
- NODE-38 Added new BSONRegExp type to allow direct serialization to MongoDB type.
- Some performance improvements by in lining code.

0.4.9 2015-08-06
----------------
- Undefined fields are omitted from serialization in objects.

0.4.8 2015-07-14
----------------
- Fixed size validation to ensure we can deserialize from dumped files.

0.4.7 2015-06-26
----------------
- Added ability to instruct deserializer to return raw BSON buffers for named array fields.
- Minor deserialization optimization by moving inlined function out.

0.4.6 2015-06-17
----------------
- Fixed serializeWithBufferAndIndex bug.

0.4.5 2015-06-17
----------------
- Removed any references to the shared buffer to avoid non GC collectible bson instances.

0.4.4 2015-06-17
----------------
- Fixed rethrowing of error when not RangeError.

0.4.3 2015-06-17
----------------
- Start buffer at 64K and double as needed, meaning we keep a low memory profile until needed.

0.4.2 2015-06-16
----------------
- More fixes for corrupt Bson

0.4.1 2015-06-16
----------------
- More fixes for corrupt Bson

0.4.0 2015-06-16
----------------
- New JS serializer serializing into a single buffer then copying out the new buffer. Performance is similar to current C++ parser.
- Removed bson-ext extension dependency for now.

0.3.2 2015-03-27
----------------
- Removed node-gyp from install script in package.json.

0.3.1 2015-03-27
----------------
- Return pure js version on native() call if failed to initialize.

0.3.0 2015-03-26
----------------
- Pulled out all C++ code into bson-ext and made it an optional dependency.

0.2.21 2015-03-21
-----------------
- Updated Nan to 1.7.0 to support io.js and node 0.12.0

0.2.19 2015-02-16
-----------------
- Updated Nan to 1.6.2 to support io.js and node 0.12.0

0.2.18 2015-01-20
-----------------
- Updated Nan to 1.5.1 to support io.js

0.2.16 2014-12-17
-----------------
- Made pid cycle on 0xffff to avoid weird overflows on creation of ObjectID's

0.2.12 2014-08-24
-----------------
- Fixes for fortify review of c++ extension
- toBSON correctly allows returns of non objects

0.2.3 2013-10-01
----------------
- Drying of ObjectId code for generation of id (Issue #54, https://github.com/moredip)
- Fixed issue where corrupt CString's could cause endless loop
- Support for Node 0.11.X > (Issue #49, https://github.com/kkoopa)

0.1.4 2012-09-25
----------------
- Added precompiled c++ native extensions for win32 ia32 and x64
