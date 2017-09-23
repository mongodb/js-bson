'use strict';

var BSON = require('../..'),
  Decimal128 = BSON.Decimal128,
  fs = require('fs'),
  expect = require('chai').expect,
  path = require('path'),
  createBSON = require('../utils'),
  bson = createBSON();

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

function findScenarios() {
  return fs
    .readdirSync(path.join(__dirname, 'specs/bson-corpus'))
    .filter(x => x.indexOf('json') !== -1)
    .map(x => JSON.parse(fs.readFileSync(path.join(__dirname, 'specs/bson-corpus', x), 'utf8')));
}

describe('BSON Corpus', function() {
  findScenarios().forEach(scenario => {
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
