'use strict';

const Buffer = require('buffer').Buffer;
const BSON = require('../../lib/bson');
const Decimal128 = BSON.Decimal128;
const EJSON = BSON.EJSON;
const expect = require('chai').expect;

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
    'Current BSON implementation of timestamp/long cannot hold these values - 1 too large.'
};

// test modifications for JavaScript
const modifiedDoubles = {
  '+1.0': { canonical_extjson: '{"d":{"$numberDouble":"1"}}' },
  '-1.0': { canonical_extjson: '{"d":{"$numberDouble":"-1"}}' },
  '1.23456789012345677E+18': { canonical_extjson: '{"d":{"$numberDouble":"1234567890123456800"}}' },
  '-1.23456789012345677E+18': {
    canonical_extjson: '{"d":{"$numberDouble":"-1234567890123456800"}}'
  },
  '0.0': { canonical_extjson: '{"d":{"$numberDouble":"0"}}' },
  '-0.0': {
    canonical_extjson: '{"d":{"$numberDouble":"0"}}',
    canonical_bson: '10000000016400000000000000000000'
  }
};

const modifiedMultitype = {
  'All BSON types': {
    canonical_extjson:
      '{"_id":{"$oid":"57e193d7a9cc81b4027498b5"},"Symbol":"symbol","String":"string","Int32":{"$numberInt":"42"},"Int64":{"$numberLong":"42"},"Double":{"$numberDouble":"-1"},"Binary":{"$binary":{"base64":"o0w498Or7cijeBSpkquNtg==","subType":"03"}},"BinaryUserDefined":{"$binary":{"base64":"AQIDBAU=","subType":"80"}},"Code":{"$code":"function() {}"},"CodeWithScope":{"$code":"function() {}","$scope":{}},"Subdocument":{"foo":"bar"},"Array":[{"$numberInt":"1"},{"$numberInt":"2"},{"$numberInt":"3"},{"$numberInt":"4"},{"$numberInt":"5"}],"Timestamp":{"$timestamp":{"t":42,"i":1}},"Regex":{"$regularExpression":{"pattern":"pattern","options":""}},"DatetimeEpoch":{"$date":{"$numberLong":"0"}},"DatetimePositive":{"$date":{"$numberLong":"2147483647"}},"DatetimeNegative":{"$date":{"$numberLong":"-2147483648"}},"True":true,"False":false,"DBPointer":{"$ref":"collection","$id":{"$oid":"57e193d7a9cc81b4027498b1"}},"DBRef":{"$ref":"collection","$id":{"$oid":"57fd71e96e32ab4225b723fb"},"$db":"database"},"Minkey":{"$minKey":1},"Maxkey":{"$maxKey":1},"Null":null,"Undefined":null}',
    canonical_bson:
      '48020000075f69640057e193d7a9cc81b4027498b50253796d626f6c000700000073796d626f6c0002537472696e670007000000737472696e670010496e743332002a00000012496e743634002a0000000000000001446f75626c6500000000000000f0bf0542696e617279001000000003a34c38f7c3abedc8a37814a992ab8db60542696e61727955736572446566696e656400050000008001020304050d436f6465000e00000066756e6374696f6e2829207b7d000f436f64655769746853636f7065001b0000000e00000066756e6374696f6e2829207b7d00050000000003537562646f63756d656e74001200000002666f6f0004000000626172000004417272617900280000001030000100000010310002000000103200030000001033000400000010340005000000001154696d657374616d7000010000002a0000000b5265676578007061747465726e0000094461746574696d6545706f6368000000000000000000094461746574696d65506f73697469766500ffffff7f00000000094461746574696d654e656761746976650000000080ffffffff085472756500010846616c73650000034442506f696e746572002b0000000224726566000b000000636f6c6c656374696f6e00072469640057e193d7a9cc81b4027498b100034442526566003d0000000224726566000b000000636f6c6c656374696f6e00072469640057fd71e96e32ab4225b723fb02246462000900000064617461626173650000ff4d696e6b6579007f4d61786b6579000a4e756c6c000a556e646566696e65640000',
    converted_extjson:
      '{"_id":{"$oid":"57e193d7a9cc81b4027498b5"},"Symbol":"symbol","String":"string","Int32":{"$numberInt":"42"},"Int64":{"$numberLong":"42"},"Double":{"$numberDouble":"-1"},"Binary":{"$binary":{"base64":"o0w498Or7cijeBSpkquNtg==","subType":"03"}},"BinaryUserDefined":{"$binary":{"base64":"AQIDBAU=","subType":"80"}},"Code":{"$code":"function() {}"},"CodeWithScope":{"$code":"function() {}","$scope":{}},"Subdocument":{"foo":"bar"},"Array":[{"$numberInt":"1"},{"$numberInt":"2"},{"$numberInt":"3"},{"$numberInt":"4"},{"$numberInt":"5"}],"Timestamp":{"$timestamp":{"t":42,"i":1}},"Regex":{"$regularExpression":{"pattern":"pattern","options":""}},"DatetimeEpoch":{"$date":{"$numberLong":"0"}},"DatetimePositive":{"$date":{"$numberLong":"2147483647"}},"DatetimeNegative":{"$date":{"$numberLong":"-2147483648"}},"True":true,"False":false,"DBPointer":{"$ref":"collection","$id":{"$oid":"57e193d7a9cc81b4027498b1"}},"DBRef":{"$ref":"collection","$id":{"$oid":"57fd71e96e32ab4225b723fb"},"$db":"database"},"Minkey":{"$minKey":1},"Maxkey":{"$maxKey":1},"Null":null,"Undefined":null}',
    converted_bson:
      '48020000075f69640057e193d7a9cc81b4027498b50253796d626f6c000700000073796d626f6c0002537472696e670007000000737472696e670010496e743332002a00000012496e743634002a0000000000000001446f75626c6500000000000000f0bf0542696e617279001000000003a34c38f7c3abedc8a37814a992ab8db60542696e61727955736572446566696e656400050000008001020304050d436f6465000e00000066756e6374696f6e2829207b7d000f436f64655769746853636f7065001b0000000e00000066756e6374696f6e2829207b7d00050000000003537562646f63756d656e74001200000002666f6f0004000000626172000004417272617900280000001030000100000010310002000000103200030000001033000400000010340005000000001154696d657374616d7000010000002a0000000b5265676578007061747465726e0000094461746574696d6545706f6368000000000000000000094461746574696d65506f73697469766500ffffff7f00000000094461746574696d654e656761746976650000000080ffffffff085472756500010846616c73650000034442506f696e746572002b0000000224726566000b000000636f6c6c656374696f6e00072469640057e193d7a9cc81b4027498b100034442526566003d0000000224726566000b000000636f6c6c656374696f6e00072469640057fd71e96e32ab4225b723fb02246462000900000064617461626173650000ff4d696e6b6579007f4d61786b6579000a4e756c6c000a556e646566696e65640000'
  }
};

const corpus = require('./tools/bson_corpus_test_loader');
describe('BSON Corpus', function() {
  corpus.forEach(scenario => {
    const deprecated = scenario.deprecated;
    const description = scenario.description;
    const valid = scenario.valid || [];

    // since doubles are formatted differently in JS than in corpus, overwrite expected results
    if (description === 'Double type') {
      valid.forEach(v => {
        if (modifiedDoubles[v.description]) {
          Object.assign(v, modifiedDoubles[v.description]);
        }
      });
      // multitype test has a double nested in object, so change those expected values too
    } else if (description === 'Multiple types within the same document') {
      valid.forEach(v => {
        if (modifiedMultitype[v.description]) {
          Object.assign(v, modifiedMultitype[v.description]);
        }
      });
    }

    describe(description, function() {
      if (valid) {
        describe('valid-bson', function() {
          valid.forEach(v => {
            if (skipBSON.hasOwnProperty(v.description)) {
              it.skip(v.description, () => {});
              return;
            }

            it(v.description, function() {
              const cB = Buffer.from(v.canonical_bson, 'hex');
              let dB, convB;
              if (v.degenerate_bson) dB = Buffer.from(v.degenerate_bson, 'hex');
              if (v.converted_bson) convB = Buffer.from(v.converted_bson, 'hex');

              const roundTripped = BSON.serialize(
                BSON.deserialize(cB, deserializeOptions),
                serializeOptions
              );

              if (deprecated) expect(convB).to.deep.equal(roundTripped);
              else expect(cB).to.deep.equal(roundTripped);

              if (dB) {
                expect(cB).to.deep.equal(
                  BSON.serialize(BSON.deserialize(dB, deserializeOptions), serializeOptions)
                );
              }
            });
          });
        });

        describe('valid-extjson', function() {
          valid.forEach(v => {
            if (skipExtendedJSON.hasOwnProperty(v.description)) {
              it.skip(v.description, () => {});
              return;
            }

            it(v.description, function() {
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
        describe('decodeErrors', function() {
          scenario.decodeErrors.forEach(d => {
            it(d.description, function() {
              const B = Buffer.from(d.bson, 'hex');
              expect(() => BSON.deserialize(B, deserializeOptions)).to.throw();
            });
          });
        });
      }

      if (scenario.parseErrors) {
        describe('parseErrors', function() {
          scenario.parseErrors.forEach(p => {
            it(p.description, function() {
              expect(() => Decimal128.fromString(scenario.string)).to.throw();
            });
          });
        });
      }
    });
  });
});
