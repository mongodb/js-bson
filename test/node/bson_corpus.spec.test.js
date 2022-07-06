//@ts-check
'use strict';

const Buffer = require('buffer').Buffer;
const BSON = require('../register-bson');
const BSONError = BSON.BSONError;
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

const parseErrorForDecimal128 = scenario => {
  // TODO(NODE-3637): remove regex of skipped tests and and add errors to d128 parsing
  const skipRegex = /dqbsr|Inexact/;
  for (const parseError of scenario.parseErrors) {
    it(parseError.description, function () {
      if (skipRegex.test(parseError.description)) {
        this.skip();
      }

      expect(
        () => BSON.Decimal128.fromString(parseError.string),
        `Decimal.fromString('${parseError.string}') should throw`
      ).to.throw(/not a valid Decimal128 string/);
    });
  }
};

const parseErrorForBinary = scenario => {
  for (const parseError of scenario.parseErrors) {
    it(parseError.description, () => {
      // Currently the BSON Binary parseError tests only check parsing relating to UUID
      // in the future this regex may need expansion
      expect(() => EJSON.parse(parseError.string)).to.throw(/UUID/);
    });
  }
};

const parseErrorForRootDocument = scenario => {
  for (const parseError of scenario.parseErrors) {
    it(parseError.description, function () {
      let caughtError;
      try {
        // Make sure not add anything more than this line to the try block
        // Assertions, for example, throw and will mess up the checks below.
        EJSON.parse(parseError.string);
      } catch (error) {
        caughtError = error;
      }

      if (/Null/.test(parseError.description)) {
        expect(caughtError).to.be.instanceOf(BSONError);
        expect(caughtError.message).to.match(/null bytes/);
      } else if (/Bad/.test(parseError.description)) {
        // There is a number of failing tests that start with 'Bad'
        // so this check is essentially making the test optional for now
        // This should assert that e is a BSONError and something about the message
        // TODO(NODE-3637): remove special logic and use expect().to.throw() and add errors to lib
        expect(caughtError).to.satisfy(e => {
          if (e instanceof BSONError) return true;
          else this.skip();
        });
      } else {
        expect(caughtError).to.be.instanceOf(BSONError);
      }
    });
  }
};

const corpus = require('./tools/bson_corpus_test_loader');
describe('BSON Corpus', function () {
  for (const scenario of corpus) {
    const deprecated = scenario.deprecated;
    const description = scenario.description;
    const scenarioName = `${description} (${scenario._filename})`;
    const valid = scenario.valid;

    describe(scenarioName, function () {
      if (valid) {
        describe('valid-bson', function () {
          for (const v of valid) {
            it(v.description, function () {
              if (
                v.description === 'All BSON types' &&
                scenario._filename === 'multi-type-deprecated'
              ) {
                // TODO(NODE-3987): fix multi-type-deprecated test
                this.skip();
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
                const jsObject = BSON.deserialize(cB, deserializeOptions);
                const roundTripped = BSON.serialize(jsObject, serializeOptions);
                expect(cB).to.deep.equal(roundTripped);
              }

              if (v.degenerate_bson) {
                const dB = Buffer.from(v.degenerate_bson, 'hex');
                // Degenerate BSON to JS equals canonical BSON in JS
                expect(BSON.deserialize(cB, deserializeOptions)).to.deep.equal(
                  BSON.deserialize(dB, deserializeOptions)
                );
                // Dengenerate BSON roundtripped is transformed to canonical BSON
                expect(cB).to.deep.equal(
                  BSON.serialize(BSON.deserialize(dB, deserializeOptions), serializeOptions)
                );
              }
            });
          }
        });

        describe('valid-extjson', function () {
          for (const v of valid) {
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
                // TODO(NODE-3396): jsonToNative doesn't correctly parse the relaxed form
                expect(nativeToREJSON(jsonToNative(rEJ))).to.equal(rEJ);
              }
            });
          }
        });
      }

      if (scenario.decodeErrors) {
        describe('decodeErrors', function () {
          for (const d of scenario.decodeErrors) {
            it(d.description, function () {
              const B = Buffer.from(d.bson, 'hex');
              expect(() => BSON.deserialize(B, deserializeOptions)).to.throw(BSONError);
            });
          }
        });
      }

      if (scenario.parseErrors) {
        describe('parseErrors', function () {
          if (description === 'Decimal128') {
            parseErrorForDecimal128(scenario);
          } else if (description === 'Binary type') {
            parseErrorForBinary(scenario);
          } else if (description === 'Top-level document validity') {
            parseErrorForRootDocument(scenario);
          } else {
            expect.fail(`No parseError implementation for '${description}''`);
          }
        });
      }
    });
  }
});
