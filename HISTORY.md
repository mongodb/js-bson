# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [6.7.0](https://github.com/mongodb/js-bson/compare/v6.6.0...v6.7.0) (2024-05-01)


### Features

* **NODE-5648:** add Long.fromStringStrict() ([#675](https://github.com/mongodb/js-bson/issues/675)) ([9d5a5df](https://github.com/mongodb/js-bson/commit/9d5a5dfe59aa6f46e4d5d844564b065bdd037154))
* **NODE-6086:** add Double.fromString() method ([#671](https://github.com/mongodb/js-bson/issues/671)) ([e943cdb](https://github.com/mongodb/js-bson/commit/e943cdb2bc69413dc2b57855c7780d6ab65dc366))
* **NODE-6087:** add Int32.fromString method ([#670](https://github.com/mongodb/js-bson/issues/670)) ([5a21889](https://github.com/mongodb/js-bson/commit/5a2188961b87d006eaf64a3e7062fd2f108fd1bc))


### Bug Fixes

* **NODE-6102:** Double.fromString prohibiting '+' character and prohibiting exponential notation ([#674](https://github.com/mongodb/js-bson/issues/674)) ([c58d1e2](https://github.com/mongodb/js-bson/commit/c58d1e213714c99bbb09d0f91a3c9199e43710dd))
* **NODE-6123:** utf8 validation is insufficiently strict ([#676](https://github.com/mongodb/js-bson/issues/676)) ([ae8bac7](https://github.com/mongodb/js-bson/commit/ae8bac7cf0653c87a06b61ac97ff02caf78707a2))
* **NODE-6144:** Long.fromString incorrectly coerces valid inputs to Long.ZERO in special cases ([#677](https://github.com/mongodb/js-bson/issues/677)) ([208f7e8](https://github.com/mongodb/js-bson/commit/208f7e82740d7f5cdbdafcd4fe1e1eae2cd463ca))

## [6.6.0](https://github.com/mongodb/js-bson/compare/v6.5.0...v6.6.0) (2024-04-01)


### Features

* **NODE-5958:** add BSON iterating API ([#656](https://github.com/mongodb/js-bson/issues/656)) ([269df91](https://github.com/mongodb/js-bson/commit/269df91f9d17831cc2010d0ed7641841be36d221))
* **NODE-5959:** make byte parsing utils available on onDemand library ([#662](https://github.com/mongodb/js-bson/issues/662)) ([efab49a](https://github.com/mongodb/js-bson/commit/efab49af8081f33e30878f4e48b3733c62457593))


### Bug Fixes

* **NODE-6042:** Binary.toString output with respect to position ([#663](https://github.com/mongodb/js-bson/issues/663)) ([d7898f9](https://github.com/mongodb/js-bson/commit/d7898f9907d389e5bb40d5b52664a1ff341b49b5))
* **NODE-6059:** clean up experimental APIs ([#665](https://github.com/mongodb/js-bson/issues/665)) ([3289184](https://github.com/mongodb/js-bson/commit/3289184ea6d42ccd67fc450393dc7594e9250418))

## [6.5.0](https://github.com/mongodb/js-bson/compare/v6.4.0...v6.5.0) (2024-03-12)


### Features

* **NODE-5506:** add Binary subtype sensitive ([#657](https://github.com/mongodb/js-bson/issues/657)) ([748ca60](https://github.com/mongodb/js-bson/commit/748ca6073c44c778f6a3f872ce009566b6e8601f))
* **NODE-5957:** add BSON indexing API ([#654](https://github.com/mongodb/js-bson/issues/654)) ([2ac17ec](https://github.com/mongodb/js-bson/commit/2ac17ec1e3c53b280efa298d137d96b2176bf046))


### Bug Fixes

* **NODE-6016:** flip byte order depending on system endianness ([#659](https://github.com/mongodb/js-bson/issues/659)) ([6a7ef5d](https://github.com/mongodb/js-bson/commit/6a7ef5da26b2f852711be23eb6dc84801d0a3ecf))

## [6.4.0](https://github.com/mongodb/js-bson/compare/v6.3.0...v6.4.0) (2024-02-29)


### Features

* **NODE-5909:** optimize writing basic latin strings ([#645](https://github.com/mongodb/js-bson/issues/645)) ([ec51256](https://github.com/mongodb/js-bson/commit/ec512568c567fc83bc8f2a715664f81534609bb9))


### Bug Fixes

* **NODE-5873:** objectId symbol property not defined on instances from cross cjs and mjs ([#643](https://github.com/mongodb/js-bson/issues/643)) ([4d9884d](https://github.com/mongodb/js-bson/commit/4d9884d301d80d90040393c7d91ac3195c113a5c))


### Performance Improvements

* **NODE-5557:** move DataView and Set allocation used for double parsing and utf8 validation to nested path ([#611](https://github.com/mongodb/js-bson/issues/611)) ([9a150e1](https://github.com/mongodb/js-bson/commit/9a150e171a20b591b77f501518b74355a7db0cd3))
* **NODE-5910:** optimize small byte copies ([#651](https://github.com/mongodb/js-bson/issues/651)) ([24d035e](https://github.com/mongodb/js-bson/commit/24d035eb31d942cfbc02bfa6fe242ccc576aad24))
* **NODE-5934:** replace DataView uses with bit math ([#649](https://github.com/mongodb/js-bson/issues/649)) ([6d343ab](https://github.com/mongodb/js-bson/commit/6d343ab9141d7e0c577e3eb236d42364007f1925))
* **NODE-5955:** use pooled memory when possible ([#653](https://github.com/mongodb/js-bson/issues/653)) ([78c4264](https://github.com/mongodb/js-bson/commit/78c426428f2ebab24d798238411a6e6b33a4b694))

## [6.3.0](https://github.com/mongodb/js-bson/compare/v6.2.0...v6.3.0) (2024-01-31)


### Features

* **NODE-3034:** deprecate number as an input to ObjectId constructor ([#640](https://github.com/mongodb/js-bson/issues/640)) ([44bec19](https://github.com/mongodb/js-bson/commit/44bec1900b53bac9938c3f0b9dcf0f75eadcd95e))
* **NODE-5861:** optimize parsing basic latin strings ([#642](https://github.com/mongodb/js-bson/issues/642)) ([cdb779b](https://github.com/mongodb/js-bson/commit/cdb779b3bab8192a830d141a010d3781d1ee8bae))

## [6.2.0](https://github.com/mongodb/js-bson/compare/v6.1.0...v6.2.0) (2023-10-16)


### Features

* **NODE-5040:** add color to BSON inspect ([#635](https://github.com/mongodb/js-bson/issues/635)) ([7802c66](https://github.com/mongodb/js-bson/commit/7802c66b2617dcc3ea7c64d58e33f403533794b4))


### Bug Fixes

* **NODE-5640:** BsonVersionError improve message clarity ([#629](https://github.com/mongodb/js-bson/issues/629)) ([eb98b8c](https://github.com/mongodb/js-bson/commit/eb98b8c39d6d5ba4ce7231ab9e0f29495d74b994))

## [6.1.0](https://github.com/mongodb/js-bson/compare/v6.0.0...v6.1.0) (2023-09-12)


### Features

* **NODE-5594:** add Decimal128.fromStringWithRounding() static method ([#617](https://github.com/mongodb/js-bson/issues/617)) ([6fee2d5](https://github.com/mongodb/js-bson/commit/6fee2d5829ba55af265405b5cc99d16610077d1c))


### Bug Fixes

* **NODE-5577:** improve ObjectId serialization by around 10% ([#614](https://github.com/mongodb/js-bson/issues/614)) ([81c8fa1](https://github.com/mongodb/js-bson/commit/81c8fa1857304634ce7d0b61ca22d0335e3b1fb7))

## [6.0.0](https://github.com/mongodb/js-bson/compare/v5.4.0...v6.0.0) (2023-08-24)


### ⚠ BREAKING CHANGES

* **NODE-5504:** bump bson major version ([#605](https://github.com/mongodb/js-bson/issues/605))
* **NODE-4770:** remove 12 length string support from ObjectId constructor ([#601](https://github.com/mongodb/js-bson/issues/601))
* **NODE-4769:** remove ISO-8859-1 string support from Binary ([#602](https://github.com/mongodb/js-bson/issues/602))
* **NODE-5223:** remove deprecated cacheHexString ([#595](https://github.com/mongodb/js-bson/issues/595))
* **NODE-4787:** bump minimum Node.js version to v16.20.1 ([#590](https://github.com/mongodb/js-bson/issues/590))

### Features

* **NODE-4769:** remove ISO-8859-1 string support from Binary ([#602](https://github.com/mongodb/js-bson/issues/602)) ([74f7f8a](https://github.com/mongodb/js-bson/commit/74f7f8a447fa0b0b1557cba14e75ff052df54d13))
* **NODE-4770:** remove 12 length string support from ObjectId constructor ([#601](https://github.com/mongodb/js-bson/issues/601)) ([409c592](https://github.com/mongodb/js-bson/commit/409c592524a6eec6a89eb96dee4b51e4f8adf5ae))
* **NODE-4787:** bump minimum Node.js version to v16.20.1 ([#590](https://github.com/mongodb/js-bson/issues/590)) ([1dcca92](https://github.com/mongodb/js-bson/commit/1dcca92b24e609a069ca7f4187e5b9521380b2f5))
* **NODE-5223:** remove deprecated cacheHexString ([#595](https://github.com/mongodb/js-bson/issues/595)) ([76eca2b](https://github.com/mongodb/js-bson/commit/76eca2b44c5fd0a4f4d5037346a29c2f9a5350b5))
* **NODE-5504:** bump bson major version ([#605](https://github.com/mongodb/js-bson/issues/605)) ([9615902](https://github.com/mongodb/js-bson/commit/9615902943927646562c145604fc477cd42e9ce6))


### Bug Fixes

* **NODE-5509:** Allow undefined or null params in ObjectId.equals ([#607](https://github.com/mongodb/js-bson/issues/607)) ([e2674c6](https://github.com/mongodb/js-bson/commit/e2674c6c2940d81e5de5b6c9500391ce5b1a2649))
* **NODE-5546:** decimal 128 fromString performs inexact rounding ([#613](https://github.com/mongodb/js-bson/issues/613)) ([1384cee](https://github.com/mongodb/js-bson/commit/1384cee024df7596e355de40acad6096b931f364))
* **NODE-5559:** account for quotes when inspecting Code and BSONSymbol ([#612](https://github.com/mongodb/js-bson/issues/612)) ([0664840](https://github.com/mongodb/js-bson/commit/06648405f33eb2a7dfb27943acd832c37180f1ed))

## [6.0.0-alpha.0](https://github.com/mongodb/js-bson/compare/v5.4.0...v6.0.0-alpha.0) (2023-08-15)


### ⚠ BREAKING CHANGES

* **NODE-5504:** bump bson major version (#605)
* **NODE-4770:** remove 12 length string support from ObjectId constructor (#601)
* **NODE-4769:** remove ISO-8859-1 string support from Binary (#602)
* **NODE-5223:** remove deprecated cacheHexString (#595)
* **NODE-4787:** bump minimum Node.js version to v16.20.1 (#590)

### Features

* **NODE-4769:** remove ISO-8859-1 string support from Binary ([#602](https://github.com/mongodb/js-bson/issues/602)) ([74f7f8a](https://github.com/mongodb/js-bson/commit/74f7f8a447fa0b0b1557cba14e75ff052df54d13))
* **NODE-4770:** remove 12 length string support from ObjectId constructor ([#601](https://github.com/mongodb/js-bson/issues/601)) ([409c592](https://github.com/mongodb/js-bson/commit/409c592524a6eec6a89eb96dee4b51e4f8adf5ae))
* **NODE-4787:** bump minimum Node.js version to v16.20.1 ([#590](https://github.com/mongodb/js-bson/issues/590)) ([1dcca92](https://github.com/mongodb/js-bson/commit/1dcca92b24e609a069ca7f4187e5b9521380b2f5))
* **NODE-5223:** remove deprecated cacheHexString ([#595](https://github.com/mongodb/js-bson/issues/595)) ([76eca2b](https://github.com/mongodb/js-bson/commit/76eca2b44c5fd0a4f4d5037346a29c2f9a5350b5))
* **NODE-5504:** bump bson major version ([#605](https://github.com/mongodb/js-bson/issues/605)) ([9615902](https://github.com/mongodb/js-bson/commit/9615902943927646562c145604fc477cd42e9ce6))


### Bug Fixes

* **NODE-5509:** Allow undefined or null params in ObjectId.equals ([#607](https://github.com/mongodb/js-bson/issues/607)) ([e2674c6](https://github.com/mongodb/js-bson/commit/e2674c6c2940d81e5de5b6c9500391ce5b1a2649))

## [5.4.0](https://github.com/mongodb/js-bson/compare/v5.3.0...v5.4.0) (2023-07-03)


### Features

* **NODE-4938:** improve react native bundle experience ([#578](https://github.com/mongodb/js-bson/issues/578)) ([7e16636](https://github.com/mongodb/js-bson/commit/7e16636dd1e6dcd8b478678ab164a8b5d2563052))


### Bug Fixes

* **NODE-5363:** defer byte slicing to utf8 decoding API in nodejs ([#585](https://github.com/mongodb/js-bson/issues/585)) ([e087042](https://github.com/mongodb/js-bson/commit/e087042720f7103e3b18fbc7cb370ac892456352))

## [5.3.0](https://github.com/mongodb/js-bson/compare/v5.2.0...v5.3.0) (2023-05-10)


### Features

* **NODE-5224:** deprecate UUID hex string cache control ([#573](https://github.com/mongodb/js-bson/issues/573)) ([70aea75](https://github.com/mongodb/js-bson/commit/70aea7512265de4a6be2c04e2535e770208f321b))


### Bug Fixes

* **NODE-4960:** UUID validation too strict ([#572](https://github.com/mongodb/js-bson/issues/572)) ([d239cd1](https://github.com/mongodb/js-bson/commit/d239cd1c2ff6feabd10e00862f556015896c1e20))

## [5.2.0](https://github.com/mongodb/js-bson/compare/v5.1.0...v5.2.0) (2023-04-04)


### Features

* **NODE-4855:** add hex and base64 ctor methods to Binary and ObjectId ([#569](https://github.com/mongodb/js-bson/issues/569)) ([0d49a63](https://github.com/mongodb/js-bson/commit/0d49a636052b540a8fc7bd9210db33a8a52f951e))

## [5.1.0](https://github.com/mongodb/js-bson/compare/v5.0.1...v5.1.0) (2023-03-16)


### Features

* **NODE-4789:** support Map stringification in EJSON ([#567](https://github.com/mongodb/js-bson/issues/567)) ([c70c82d](https://github.com/mongodb/js-bson/commit/c70c82dd815fcf7a58dba025578764177da4ef5a))

### [5.0.1](https://github.com/mongodb/js-bson/compare/v5.0.0...v5.0.1) (2023-02-16)


### Bug Fixes

* **NODE-5025:** no type definitions for es module ([#563](https://github.com/mongodb/js-bson/issues/563)) ([50e90fc](https://github.com/mongodb/js-bson/commit/50e90fc1a7ff4a313a382b62a9b4972e2b8a62f2))
* **NODE-5048:** webpack unable to bundle import with leading 'node:' ([#564](https://github.com/mongodb/js-bson/issues/564)) ([3aed24a](https://github.com/mongodb/js-bson/commit/3aed24a006bec43839269ac05007b0c5eb2b42bd))
* **NODE-5056:** EJSON.parse date handling when useBigInt64=true ([#562](https://github.com/mongodb/js-bson/issues/562)) ([d5088af](https://github.com/mongodb/js-bson/commit/d5088afab081b671215f2157bf3dabf38ef4ea7f))

## [5.0.0](https://github.com/mongodb/js-bson/compare/v5.0.0-alpha.3...v5.0.0) (2023-01-31)

## [5.0.0-alpha.3](https://github.com/mongodb/js-bson/compare/v4.7.0...v5.0.0-alpha.3) (2023-01-20)


### ⚠ BREAKING CHANGES

* **NODE-4892:** error on bson types not from this version (#543)
* **NODE-4890:** make all thrown errors into BSONErrors (#545)
* **NODE-4713:** modernize bundling (#534)
* **NODE-1921:** validate serializer root input (#537)
* **NODE-4711:** remove evalFunctions option (#539)

### Features

* **NODE-1921:** validate serializer root input ([#537](https://github.com/mongodb/js-bson/issues/537)) ([95d5edf](https://github.com/mongodb/js-bson/commit/95d5edf5c4f8a1cd6c23deaac3a446959fde779e))
* **NODE-4711:** remove evalFunctions option ([#539](https://github.com/mongodb/js-bson/issues/539)) ([0427eb5](https://github.com/mongodb/js-bson/commit/0427eb588073a07d9e88ddf6155d2c1891ae5ad1))
* **NODE-4713:** modernize bundling ([#534](https://github.com/mongodb/js-bson/issues/534)) ([28ce4d5](https://github.com/mongodb/js-bson/commit/28ce4d584ce399d99c41c5f5fd022b6e16f7b913))
* **NODE-4870:** Support BigInt serialization ([#541](https://github.com/mongodb/js-bson/issues/541)) ([e9e40a2](https://github.com/mongodb/js-bson/commit/e9e40a2cceb6392065a4f217d17fc4211aa1bbd7))
* **NODE-4871:** Add support for int64 deserialization to BigInt ([#542](https://github.com/mongodb/js-bson/issues/542)) ([9ff60ba](https://github.com/mongodb/js-bson/commit/9ff60baedf2c3fcd5faf3760d4df03235531c608))
* **NODE-4873:** support EJSON stringify from BigInt to $numberLong ([#547](https://github.com/mongodb/js-bson/issues/547)) ([37e8690](https://github.com/mongodb/js-bson/commit/37e86901cfa7e8e19bf2c2790280b16ae0c44626))
* **NODE-4874:** support EJSON parse for BigInt from $numberLong ([#552](https://github.com/mongodb/js-bson/issues/552)) ([854aa70](https://github.com/mongodb/js-bson/commit/854aa70cd8ded233346e430ba5e2895ff23ec3f2))
* **NODE-4890:** make all thrown errors into BSONErrors ([#545](https://github.com/mongodb/js-bson/issues/545)) ([5b837a9](https://github.com/mongodb/js-bson/commit/5b837a9e5019016529a83700f3ba3065d5e53e80))
* **NODE-4892:** error on bson types not from this version ([#543](https://github.com/mongodb/js-bson/issues/543)) ([d9f0eaa](https://github.com/mongodb/js-bson/commit/d9f0eaa243ceeba8dd82e9c3b07fd8bca10cfc44))
* **NODE-4927:** exports in package.json for react native and document how to polyfill for BSON ([#550](https://github.com/mongodb/js-bson/issues/550)) ([3b4b61e](https://github.com/mongodb/js-bson/commit/3b4b61ed8dfbe7e7f8635e4584e1b17a91c1c4df))


### Bug Fixes

* **NODE-4771:** serializeFunctions breaks function names outside of basic latin ([#538](https://github.com/mongodb/js-bson/issues/538)) ([35a9234](https://github.com/mongodb/js-bson/commit/35a92341c0860fb41cbd5761250c565154ce1353))
* **NODE-4887:** serializeInto does not check for the presence of a toBSON method for values in Map entries ([#555](https://github.com/mongodb/js-bson/issues/555)) ([ebc1c76](https://github.com/mongodb/js-bson/commit/ebc1c765276e83c9e8f073efdf41b27d4e5e7d7b))
* **NODE-4905:** double precision accuracy in canonical EJSON ([#548](https://github.com/mongodb/js-bson/issues/548)) ([e0dbb17](https://github.com/mongodb/js-bson/commit/e0dbb17d0a13f3aca9879f08cba3573b2a84fd8d))
* **NODE-4932:** remove .0 suffix from double extended json values ([#554](https://github.com/mongodb/js-bson/issues/554)) ([946866d](https://github.com/mongodb/js-bson/commit/946866d1a1b265f13c0e6c542f54b9786726fa85))

## [4.7.0](https://github.com/mongodb/js-bson/compare/v4.6.5...v4.7.0) (2022-08-18)


### Features

* **NODE-4405:** support serializing UUID class ([#508](https://github.com/mongodb/js-bson/issues/508)) ([f5dc9ed](https://github.com/mongodb/js-bson/commit/f5dc9edf915cc119f02f53ec84d1c640695dced7))
* **NODE-4419:** UUID class deserialization ([#509](https://github.com/mongodb/js-bson/issues/509)) ([ff2b975](https://github.com/mongodb/js-bson/commit/ff2b97585848730fcf90cd21c14ba2a18a0ed016))
* **NODE-4506:** Make UUID a subclass of binary ([#512](https://github.com/mongodb/js-bson/issues/512)) ([e9afa9d](https://github.com/mongodb/js-bson/commit/e9afa9dcfc295da8ff53b28658835fc76cde557c))
* **NODE-4535:** automatically promote UUIDs when deserializing and parsing UUIDs ([#513](https://github.com/mongodb/js-bson/issues/513)) ([1dc7eae](https://github.com/mongodb/js-bson/commit/1dc7eaea6a61924be66ae5b8a05b74d5dd9c7b1e))

### [4.6.5](https://github.com/mongodb/js-bson/compare/v4.6.4...v4.6.5) (2022-07-07)


### Bug Fixes

* **NODE-3630:** remove float parser and test edge cases for Double ([#502](https://github.com/mongodb/js-bson/issues/502)) ([54ca603](https://github.com/mongodb/js-bson/commit/54ca603e8cc3b038517556acb378f3e345f3fce2))
* **NODE-4211:** Do not require crypto in browser builds ([#500](https://github.com/mongodb/js-bson/issues/500)) ([b32ab40](https://github.com/mongodb/js-bson/commit/b32ab40a48d044be15d935c805753525ec06e855))
* **NODE-4302:** remove downlevel ts and typesVersions ([#501](https://github.com/mongodb/js-bson/issues/501)) ([651b60e](https://github.com/mongodb/js-bson/commit/651b60edb2d4cdd7933e99d5bc5f7fc3a925eb7a))
* **NODE-4381:** handle `__proto__` well in EJSON ([#506](https://github.com/mongodb/js-bson/issues/506)) ([4bda57d](https://github.com/mongodb/js-bson/commit/4bda57d9593e5e357979a3c60d132fbd07491f75))

### [4.6.4](https://github.com/mongodb/js-bson/compare/v4.6.3...v4.6.4) (2022-05-19)

### [4.6.3](https://github.com/mongodb/js-bson/compare/v4.6.2...v4.6.3) (2022-04-20)

### [4.6.2](https://github.com/mongodb/js-bson/compare/v4.6.1...v4.6.2) (2022-03-22)


### Bug Fixes

* **MONGOSH-1155:** update error message in ObjectId class ([#493](https://github.com/mongodb/js-bson/issues/493)) ([67fbc7c](https://github.com/mongodb/js-bson/commit/67fbc7cc8fc20d9c39720ba3f5e872c4f27eb8c6))
* **NODE-3015:** ObjectId.equals should use Buffer.equals for better performance ([#478](https://github.com/mongodb/js-bson/issues/478)) ([8305bdf](https://github.com/mongodb/js-bson/commit/8305bdf333a4ddec99121b42d9477958342b0fda))
* **NODE-3962:** correct type for ObjectiId._bsontype ([#480](https://github.com/mongodb/js-bson/issues/480)) ([9671773](https://github.com/mongodb/js-bson/commit/9671773880b0e01d84259f1eb5d49e32070a9e8a))

### [4.6.1](https://github.com/mongodb/js-bson/compare/v4.6.0...v4.6.1) (2022-01-06)


### Bug Fixes

* **NODE-3760:** ObjectId.isValid string and byte length match ([#475](https://github.com/mongodb/js-bson/issues/475)) ([187d1c4](https://github.com/mongodb/js-bson/commit/187d1c40f7222fd63dbc55d1535669ff0bfcbce2))
* **NODE-3815:** update Decimal128 constructor validation ([#476](https://github.com/mongodb/js-bson/issues/476)) ([95e8293](https://github.com/mongodb/js-bson/commit/95e8293f95b6fff65a37962b05cebf40f0cb6a41))
* **NODE-3821:** nullish check before using toBSON override function ([#477](https://github.com/mongodb/js-bson/issues/477)) ([1d898b6](https://github.com/mongodb/js-bson/commit/1d898b6cb412138fad5ba1abbde02aa7a462d77d))

## [4.6.0](https://github.com/mongodb/js-bson/compare/v4.5.4...v4.6.0) (2021-11-23)


### Features

* **NODE-3740:** Implement root and top level key utf-8 validation settings for BSON ([#472](https://github.com/mongodb/js-bson/issues/472)) ([07019a0](https://github.com/mongodb/js-bson/commit/07019a036ca4a4a15976707099bd949d2c042699))


### Bug Fixes

* **NODE-3724:** Fix BSONTypeError and BSONError to correctly handle instanceof checks ([#471](https://github.com/mongodb/js-bson/issues/471)) ([d8f334b](https://github.com/mongodb/js-bson/commit/d8f334bd3086ee7764849dd145ad513dd1067eaf))

### [4.5.4](https://github.com/mongodb/js-bson/compare/v4.5.3...v4.5.4) (2021-11-03)


### Bug Fixes

* **NODE-3640:** Fix Int32 constructor to coerce its argument to int32 ([#466](https://github.com/mongodb/js-bson/issues/466)) ([d388f1e](https://github.com/mongodb/js-bson/commit/d388f1efc1831ceecec11b79dc564d3116a97779))
* **NODE-3662:** error checking to make sure that ObjectId results in object with correct properties ([#467](https://github.com/mongodb/js-bson/issues/467)) ([5f99b1b](https://github.com/mongodb/js-bson/commit/5f99b1bfa74bcf75700174f8d4a8b974f9753e7f))

### [4.5.3](https://github.com/mongodb/js-bson/compare/v4.5.2...v4.5.3) (2021-10-05)


### Bug Fixes

* **NODE-3493:** code and symbol tests are partially testing the wrong types ([#459](https://github.com/mongodb/js-bson/issues/459)) ([80d7f03](https://github.com/mongodb/js-bson/commit/80d7f039af5472fd51b8a1f7873f4340ed5f0d5e))
* **NODE-3534:** add subtype 0x6 and 0x7 constants on Binary class ([#461](https://github.com/mongodb/js-bson/issues/461)) ([52cfe9c](https://github.com/mongodb/js-bson/commit/52cfe9c02a2483e197140e9838bf969c6f8e750e))
* **NODE-3629:** correct corpus runner and add null checks ([#464](https://github.com/mongodb/js-bson/issues/464)) ([d75102d](https://github.com/mongodb/js-bson/commit/d75102d6bb995c5146d7bc1fb8606c1851c8bbc0))

### [4.5.2](https://github.com/mongodb/js-bson/compare/v4.5.1...v4.5.2) (2021-09-14)


### Bug Fixes

* **NODE-3021:** fix a long standing bug in Decimal128.fromString() ([#458](https://github.com/mongodb/js-bson/issues/458)) ([824939a](https://github.com/mongodb/js-bson/commit/824939a4a47759b0c422010129480eb121620c83))
* **NODE-3582:** fix internal marked APIs, add toString methods to Int32 and Double ([#457](https://github.com/mongodb/js-bson/issues/457)) ([b46ab5f](https://github.com/mongodb/js-bson/commit/b46ab5feff2090351be464ab5b180b4aeb675f69))

### [4.5.1](https://github.com/mongodb/js-bson/compare/v4.5.0...v4.5.1) (2021-08-24)


### Bug Fixes

* **NODE-3561:** umd bundle fails to require util ([#455](https://github.com/mongodb/js-bson/issues/455)) ([1c15155](https://github.com/mongodb/js-bson/commit/1c151555c76f2b80e699ae9090a256f7dbdfb8ca))

## [4.5.0](https://github.com/mongodb/js-bson/compare/v4.4.1...v4.5.0) (2021-08-19)


### Features

* **NODE-3504:** add unambiguous `Timestamp()` constructor overload ([#449](https://github.com/mongodb/js-bson/issues/449)) ([0298dd8](https://github.com/mongodb/js-bson/commit/0298dd8293523869433beccb8c17671b7f9b6fbd))


### Bug Fixes

* **NODE-3451:** fix performance regression from v1 ([#451](https://github.com/mongodb/js-bson/issues/451)) ([2330ab1](https://github.com/mongodb/js-bson/commit/2330ab1274166c285cbd8a0c3eff5a52573cf34d))
* **NODE-3520:** global not defined in esm bundles ([#452](https://github.com/mongodb/js-bson/issues/452)) ([cb82a80](https://github.com/mongodb/js-bson/commit/cb82a802aff4039bc397bea2402c5f76450bb0f0))

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
