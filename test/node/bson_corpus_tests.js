var BSON = require('../..'),
  Decimal128 = BSON.Decimal128,
  Long = BSON.Long,
  deserialize = require('../../extended-json').deserialize,
  serialize = require('../../extended-json').serialize,
  f = require('util').format,
  assert = require('assert'),
  fs = require('fs');

var createBSON = require('../utils');
var bson = createBSON();

function executeValid(spec, scenarios) {
  console.log('  * Starting valid scenario tests');

  for(var i = 0; i < scenarios.length; i++) {
    var scenario = scenarios[i];
    console.log(f('    - valid scenario [%s] with \n      bson: [%s]  \n      ext-json: [%s]'
      , scenario.description, scenario.bson, scenario.extjson));

      // Get the scenario bson
      var B = new Buffer(scenario.bson, 'hex');
      var E = null;

      // Get the extended json
      if(scenario.extjson) var E = JSON.parse(scenario.extjson);

      // If we have a canonical bson use it instead
      if(scenario.canonical_bson) {
        var cB = new Buffer(scenario.canonical_bson, 'hex');
      } else {
        var cB = B;
      }

      // If we have cannonical extended json use it
      if(scenario.canonical_extjson) {
        var cE = JSON.parse(scenario.canonical_extjson);
      } else {
        var cE = E;
      }

      //
      // Baseline tests
      if(cB) {
        // console.log("============================================ 0")
        // console.dir(deserialize(E))
        // console.dir(bson.deserialize(B, {
        //   promoteLongs: false, bsonRegExp: true
        // }))
        // console.dir(bson.deserialize(bson.serialize(bson.deserialize(B, {
        //   promoteLongs: false, bsonRegExp: true
        // }))))
        // console.log("============================================ 1")
        // console.dir(B)
        // console.dir(cB)
        // console.dir(bson.serialize(bson.deserialize(B, {
        //   promoteLongs: false, bsonRegExp: true
        // })))
        assert.deepEqual(cB, bson.serialize(bson.deserialize(B, {
          promoteLongs: false, bsonRegExp: true
        })));
      }

      if(cE) {
        assert.deepEqual(cE, serialize(bson.deserialize(B, {
          promoteLongs: false, bsonRegExp: true
        })));
        assert.deepEqual(cE, serialize(deserialize(E)));
      }

      // if "lossy" not in case:
      if(!scenario.lossy && cB && E) {
        assert.deepEqual(cB, bson.serialize(deserialize(E)));
      }

      //
      // Double check canonical BSON if provided
      try {
        var noMatch = false;
        assert.deepEqual(cB, B);
      } catch(e) {
        var noMatch = true;
      }

      if(noMatch) {
        assert.deepEqual(cB, bson.serialize(bson.deserialize(cB, {
          promoteLongs: false, bsonRegExp: true
        })))
        assert.deepEqual(cE, serialize(bson.deserialize(cB, {
          promoteLongs: false, bsonRegExp: true
        })))
      }

      try {
        var noMatch = false;
        assert.deepEqual(cE, E);
      } catch(e) {
        var noMatch = true;
      }
  };
}

function executeDecodeError(spec, scenarios) {
  console.log('  * Starting decode error scenario tests');

  for(var i = 0; i < scenarios.length; i++) {
    var scenario = scenarios[i];
    console.log(f('    - decode error [%s] with \n      bson: [%s]'
      , scenario.description, scenario.bson));

    // Convert the hex string to a binary buffer
    var buffer = new Buffer(scenario.bson, 'hex');
    var failed = false;

    try {
      // Attempt to deserialize the bson
      var deserializedObject = bson.deserialize(buffer, {
        promoteLongs: false, bsonRegExp: true
      });

      // console.log("============================ deserializedObject")
      // console.dir(deserializedObject)
    } catch(err) {
      // console.log(err)
      failed = true;
    }

    assert.ok(failed);
  };
}

function executeParseErrors(spec, scenarios) {
  console.log('  * Starting parse error scenario tests');
  var NAN = new Buffer([0x7c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse());

  for(var i = 0; i < scenarios.length; i++) {
    var scenario = scenarios[i];
    console.log(f('    - parse error [%s] with \n      string: [%s]'
      , scenario.description, scenario.string));

    var threw = false;
    try {
      var value = Decimal128.fromString(scenario.string);
      if(value.toString != scenario.string) threw = true;
    } catch(e) {
      threw = true;
    }

    assert.deepEqual(true, threw);
  }
}

function printScenarioInformation(spec) {
  console.log(f("= Starting %s for bson_type %s with test key %s"
    , spec.description, spec.bson_type, spec.test_key));
}

function executeAll(spec) {
  printScenarioInformation(spec);
  executeValid(spec, spec.valid || []);
  executeDecodeError(spec, spec.decodeErrors || []);
  executeParseErrors(spec, spec.parseErrors || []);
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/array.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/array'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/binary.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/binary'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/boolean.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/boolean'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/code_w_scope.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/code_w_scope'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/code.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/code'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/datetime.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/datetime'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/document.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/document'));
  test.done();
}

// /**
//  * @ignore
//  */
// exports['Pass all BSON corpus ./specs/bson-corpus/double.json'] = function(test) {
//   executeAll(require(__dirname + '/specs/bson-corpus/double'));
//   test.done();
// }

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/int32.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/int32'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/int64.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/int64'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/maxkey.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/maxkey'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/minkey.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/minkey'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/null.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/null'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/oid.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/oid'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/regex.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/regex'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/string.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/string'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/symbol.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/symbol'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/timestamp.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/timestamp'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/top.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/top'));
  test.done();
}

/**
 * @ignore
 */
exports['Pass entire Decimal128 corpus ./specs/decimal128/*'] = function(test) {
  executeAll(require(__dirname + '/specs/decimal128/decimal128-1.json'));
  executeAll(require(__dirname + '/specs/decimal128/decimal128-2.json'));
  executeAll(require(__dirname + '/specs/decimal128/decimal128-3.json'));
  executeAll(require(__dirname + '/specs/decimal128/decimal128-4.json'));
  executeAll(require(__dirname + '/specs/decimal128/decimal128-5.json'));
  executeAll(require(__dirname + '/specs/decimal128/decimal128-6.json'));
  executeAll(require(__dirname + '/specs/decimal128/decimal128-7.json'));
  test.done();
}
