'use strict';

const Buffer = require('buffer').Buffer;
const BSON = require('../register-bson');
const EJSON = BSON.EJSON;

const deserializeOptions = {
  bsonRegExp: true,
  promoteLongs: true,
  promoteValues: false
};

const serializeOptions = {
  ignoreUndefined: false
};

function nativeToBson(native) {
  const serializeOptions = {
    ignoreUndefined: false
  };

  return BSON.serialize(native, serializeOptions);
}

function bsonToNative(bson) {
  const deserializeOptions = {
    bsonRegExp: true,
    promoteLongs: true,
    promoteValues: false
  };

  return BSON.deserialize(bson, deserializeOptions);
}

function jsonToNative(json) {
  return EJSON.parse(json, { relaxed: false });
}

function nativeToCEJSON(native) {
  return EJSON.stringify(native, { relaxed: false });
}

function nativeToREJSON(native) {
  return EJSON.stringify(native, { relaxed: true });
}

function normalize(cEJ) {
  return JSON.stringify(JSON.parse(cEJ));
}

// tests from the corpus that we need to skip, and explanations why
const skipBSON = {
  'NaN with payload':
    'passing this would require building a custom type to store the NaN payload data.'
};

const skipExtendedJSON = {
  'Timestamp with high-order bit set on both seconds and increment':
    'Current BSON implementation of timestamp/long cannot hold these values - 1 too large.',
  'Timestamp with high-order bit set on both seconds and increment (not UINT32_MAX)':
    'Current BSON implementation of timestamp/long cannot hold these values - 1 too large.'
};

const corpus = require('./tools/bson_corpus_test_loader');
describe('BSON Corpus', function () {
  corpus.forEach(scenario => {
    const deprecated = scenario.deprecated;
    const description = scenario.description;
    const valid = scenario.valid || [];

    describe(description, function () {
      if (valid) {
        describe('valid-bson', function () {
          valid.forEach(v => {
            if (Reflect.has(skipBSON, v.description)) {
              it.skip(v.description, () => {});
              return;
            }

            it(v.description, function () {
              if (v.description === 'All BSON types' && deprecated) {
                // there is just too much variation in the specified expectation to make this work
                this.skip();
                return;
              }

              const cB = Buffer.from(v.canonical_bson, 'hex');
              if (deprecated) {
                const roundTripped = BSON.serialize(
                  BSON.deserialize(
                    cB,
                    Object.assign({}, deserializeOptions, { promoteValues: true })
                  ),
                  serializeOptions
                );

                const convB = Buffer.from(v.converted_bson, 'hex');
                expect(convB).to.deep.equal(roundTripped);
              } else {
                const roundTripped = BSON.serialize(
                  BSON.deserialize(cB, deserializeOptions),
                  serializeOptions
                );

                expect(cB).to.deep.equal(roundTripped);
              }

              if (v.degenerate_bson) {
                const dB = Buffer.from(v.degenerate_bson, 'hex');
                expect(cB).to.deep.equal(
                  BSON.serialize(BSON.deserialize(dB, deserializeOptions), serializeOptions)
                );
              }
            });
          });
        });

        describe('valid-extjson', function () {
          valid.forEach(v => {
            if (Reflect.has(skipExtendedJSON, v.description)) {
              it.skip(v.description, () => {});
              return;
            }

            it(v.description, function () {
              // read in test case data. if this scenario is for a deprecated
              // type, we want to use the "converted" BSON and EJSON, which
              // use the upgraded version of the deprecated type. otherwise,
              // just use canonical.
              let cB, cEJ;
              if (deprecated) {
                cB = Buffer.from(v.converted_bson, 'hex');
                cEJ = normalize(v.converted_extjson);
              } else {
                cB = Buffer.from(v.canonical_bson, 'hex');
                cEJ = normalize(v.canonical_extjson);
              }

              // convert inputs to native Javascript objects
              const nativeFromCB = bsonToNative(cB);

              // round tripped EJSON should match the original
              expect(nativeToCEJSON(jsonToNative(cEJ))).to.equal(cEJ);

              // invalid, but still parseable, EJSON. if provided, make sure that we
              // properly convert it to canonical EJSON and BSON.
              if (v.degenerate_extjson) {
                const dEJ = normalize(v.degenerate_extjson);
                const roundTrippedDEJ = nativeToCEJSON(jsonToNative(dEJ));
                expect(roundTrippedDEJ).to.equal(cEJ);

                if (!v.lossy) {
                  expect(nativeToBson(jsonToNative(dEJ))).to.deep.equal(cB);
                }
              }

              // as long as conversion isn't lossy (i.e. BSON can represent everything in
              // the EJSON), make sure EJSON -> native -> BSON matches canonical BSON.
              if (!v.lossy) {
                expect(nativeToBson(jsonToNative(cEJ))).to.deep.equal(cB);
              }

              // the reverse direction, BSON -> native -> EJSON, should match canonical EJSON.
              expect(nativeToCEJSON(nativeFromCB)).to.equal(cEJ);

              if (v.relaxed_extjson) {
                let rEJ = normalize(v.relaxed_extjson);
                // BSON -> native -> relaxed EJSON matches provided
                expect(nativeToREJSON(nativeFromCB)).to.equal(rEJ);

                // relaxed EJSON -> native -> relaxed EJSON unchanged
                expect(nativeToREJSON(jsonToNative(rEJ))).to.equal(rEJ);
              }
            });
          });
        });
      }

      if (scenario.decodeErrors) {
        describe('decodeErrors', function () {
          scenario.decodeErrors.forEach(d => {
            it(d.description, function () {
              const B = Buffer.from(d.bson, 'hex');
              expect(() => BSON.deserialize(B, deserializeOptions)).to.throw();
            });
          });
        });
      }

      if (scenario.parseErrors) {
        describe('parseErrors', function () {
          scenario.parseErrors.forEach(p => {
            it(p.description, function () {
              expect(() => jsonToNative(scenario.string)).to.throw();
            });
          });
        });
      }
    });
  });
});
