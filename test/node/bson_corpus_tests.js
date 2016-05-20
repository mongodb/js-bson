var BSON = require('../../lib/bson/bson'),
  // Code = BSON.Code,
  // Binary = BSON.Binary,
  // Timestamp = BSON.Timestamp,
  // Long = BSON.Long,
  // MongoReply = BSON.MongoReply,
  // ObjectID = BSON.ObjectID,
  // ObjectId = BSON.ObjectID,
  // Symbol = BSON.Symbol,
  // DBRef = BSON.DBRef,
  // Double = BSON.Double,
  // MinKey = BSON.MinKey,
  // MaxKey = BSON.MaxKey,
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

    // Convert the ext-json to the correct type
    var document = deserialize(JSON.parse(scenario.extjson));
    // Convert the hex string to a binary buffer
    var buffer = new Buffer(scenario.canonical_bson || scenario.bson, 'hex');

    // Attempt to deserialize the bson
    var deserializedObject = bson.deserialize(buffer);
    // Attempt to serialize the document
    var serializedBuffer = bson.serialize(document);

    // Test for the test key
    assert.ok(deserializedObject[spec.test_key]);
    // Validate the serializedBuffer
    assert.equal(buffer.toString('hex'), serializedBuffer.toString('hex'));
    // Validate the deserialized object
    assert.deepEqual(document, deserializedObject);
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
