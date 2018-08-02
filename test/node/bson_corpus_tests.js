'use strict';

const Buffer = require('buffer').Buffer;
const BSON = require('../../lib/bson');
const Decimal128 = BSON.Decimal128;
const expect = require('chai').expect;

var deserializeOptions = {
  bsonRegExp: true,
  promoteLongs: true,
  promoteValues: false
};

var serializeOptions = {
  ignoreUndefined: false
};

// tests from the corpus that we need to skip, and explanations why

var skip = {
  'NaN with payload':
    'passing this would require building a custom type to store the NaN payload data.'
};

const corpus = require('./tools/bson_corpus_test_loader');

describe('BSON Corpus', function() {
  corpus.forEach(scenario => {
    describe(scenario.description, function() {
      if (scenario.valid) {
        describe('valid', function() {
          scenario.valid.forEach(v => {
            if (skip.hasOwnProperty(v.description)) {
              it.skip(v.description, () => {});
              return;
            }

            it(v.description, function() {
              var cB = new Buffer(v.canonical_bson, 'hex');
              if (v.degenerate_bson) var dB = new Buffer(v.degenerate_bson, 'hex');
              if (v.converted_bson) var convB = new Buffer(v.converted_bson, 'hex');

              var roundTripped = BSON.serialize(
                BSON.deserialize(cB, deserializeOptions),
                serializeOptions
              );

              if (scenario.deprecated) expect(convB).to.deep.equal(roundTripped);
              else expect(cB).to.deep.equal(roundTripped);

              if (dB) {
                expect(cB).to.deep.equal(
                  BSON.serialize(BSON.deserialize(dB, deserializeOptions), serializeOptions)
                );
              }
            });
          });
        });
      }

      if (scenario.decodeErrors) {
        describe('decodeErrors', function() {
          scenario.decodeErrors.forEach(d => {
            it(d.description, function() {
              var B = new Buffer(d.bson, 'hex');
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
