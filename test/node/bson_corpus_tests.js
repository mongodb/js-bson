'use strict';

const Buffer = require('buffer').Buffer;
const BSON = require('../..');
const Decimal128 = BSON.Decimal128;
const expect = require('chai').expect;
const createBSON = require('../utils');
const bson = createBSON();

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

              var roundTripped = bson.serialize(
                bson.deserialize(cB, deserializeOptions),
                serializeOptions
              );

              if (scenario.deprecated) expect(convB).to.deep.equal(roundTripped);
              else expect(cB).to.deep.equal(roundTripped);

              if (dB) {
                expect(cB).to.deep.equal(
                  bson.serialize(bson.deserialize(dB, deserializeOptions), serializeOptions)
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
              expect(() => bson.deserialize(B, deserializeOptions)).to.throw();
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
