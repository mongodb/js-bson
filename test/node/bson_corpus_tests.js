'use strict';

var BSON = require('../..'),
  Decimal128 = BSON.Decimal128,
  f = require('util').format,
  fs = require('fs'),
  expect = require('chai').expect,
  path = require('path');

var createBSON = require('../utils');
var bson = createBSON();

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

function testScenario(scenario) {
  if (scenario.valid) {
    console.log('  * Starting valid scenario tests');

    scenario.valid.forEach(v => {
      if (skip.hasOwnProperty(v.description)) return;

      console.log(
        f(
          '    - valid scenario [%s] with \n      bson: [%s]  \n      ext-json: [%s]',
          v.description,
          v.canonical_bson,
          v.canonical_extjson
        )
      );

      var cB = new Buffer(v.canonical_bson, 'hex');
      if (v.degenerate_bson) var dB = new Buffer(v.degenerate_bson, 'hex');
      if (v.converted_bson) var convB = new Buffer(v.converted_bson, 'hex');

      var roundTripped = bson.serialize(bson.deserialize(cB, deserializeOptions), serializeOptions);

      if (scenario.deprecated) expect(convB).to.deep.equal(roundTripped);
      else expect(cB).to.deep.equal(roundTripped);

      if (dB)
        expect(cB).to.deep.equal(
          bson.serialize(bson.deserialize(dB, deserializeOptions), serializeOptions)
        );
    });
  }

  if (scenario.decodeErrors) {
    console.log('  * Starting decode error scenario tests');
    scenario.decodeErrors.forEach(d => {
      console.log(f('    - decode error [%s] with \n      bson: [%s]', d.description, d.bson));
      var B = new Buffer(d.bson, 'hex');
      expect(() => bson.deserialize(B, deserializeOptions)).to.throw();
    });
  }

  if (scenario.parseErrors) {
    console.log('  * Starting parse error scenario tests');
    scenario.parseErrors.forEach(scenario => {
      console.log(
        f('    - parse error [%s] with \n      string: [%s]', scenario.description, scenario.string)
      );
      expect(() => Decimal128.fromString(scenario.string)).to.throw();
    });
  }
}

function printScenarioInformation(scenario) {
  console.log(
    f(
      '= Starting %s for bson_type %s with test key %s',
      scenario[1].description,
      scenario[1].bson_type,
      scenario[1].test_key
    )
  );
}

function findScenarios() {
  return fs
    .readdirSync(path.join(__dirname, 'specs/bson-corpus'))
    .filter(x => {
      return x.indexOf('json') !== -1;
    })
    .map(x => {
      return [x, fs.readFileSync(path.join(__dirname, 'specs/bson-corpus', x), 'utf8')];
    })
    .map(x => {
      return [path.basename(x[0], '.json'), JSON.parse(x[1])];
    });
}

findScenarios().forEach(scenario => {
  var exportName = f('Pass all BSON corpus ./specs/bson-corpus/%s.json', scenario[0]);
  exports[exportName] = function(test) {
    printScenarioInformation(scenario);
    testScenario(scenario[1]);
    test.done();
  };
});
