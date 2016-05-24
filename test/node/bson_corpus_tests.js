var BSON = require('../../lib/bson/bson'),
  deserialize = require('../../extended-json').deserialize,
  f = require('util').format,
  assert = require('assert'),
  fs = require('fs');

var bson = new BSON();

function executeValid(spec, scenarios) {
  console.log('  * Starting valid scenario tests');

  for(var i = 0; i < scenarios.length; i++) {
    var scenario = scenarios[i];
    console.log(f('    - valid scenario [%s] with \n      bson: [%s]  \n      ext-json: [%s]'
      , scenario.description, scenario.bson, scenario.extjson));

    // Convert the hex string to a binary buffer
    var buffer = new Buffer(scenario.canonical_bson || scenario.bson, 'hex');

    // Do we have an extended json field
    if(scenario.extjson) {
      // Convert the ext-json to the correct type
      var document = deserialize(JSON.parse(scenario.extjson));
      // Attempt to serialize the document
      var serializedBuffer = bson.serialize(document);
      // Validate the serializedBuffer
      assert.equal(buffer.toString('hex'), serializedBuffer.toString('hex'));
      // Attempt to deserialize the bson
      var deserializedObject = bson.deserialize(buffer, {
        promoteLongs: false,
        bsonRegExp: true
      });

      // Validate the deserialized object
      assert.deepEqual(document, deserializedObject);
    }

    // Attempt to deserialize the bson
    var deserializedObject = bson.deserialize(buffer);

    // Test for the test key
    var keys = Object.keys(deserializedObject);
    assert.ok(keys.indexOf(spec.test_key) != -1);
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
      var deserializedObject = bson.deserialize(buffer);
      console.dir(deserializedObject)
    } catch(err) {
      // console.dir(err)
      failed = true;
    }

    assert.ok(failed);
  };
}

function executeParseErrors(spec, scenarios) {
  scenarios.forEach(function(scenario) {

  });
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

/**
 * @ignore
 */
exports['Pass all BSON corpus ./specs/bson-corpus/double.json'] = function(test) {
  executeAll(require(__dirname + '/specs/bson-corpus/double'));
  test.done();
}

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
