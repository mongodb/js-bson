'use strict';

var BSON = require('../..'),
  Code = BSON.Code,
  Binary = BSON.Binary,
  Timestamp = BSON.Timestamp,
  Long = BSON.Long,
  ObjectID = BSON.ObjectID,
  DBRef = BSON.DBRef,
  MinKey = BSON.MinKey,
  MaxKey = BSON.MaxKey,
  expect = require('chai').expect;

var createBSON = require('../utils');

describe('BSON Compliance', function() {
  /**
   * @ignore
   */
  it('Pass all corrupt BSON scenarios ./compliance/corrupt.json', function(done) {
    // Read and parse the json file
    var scenarios = require(__dirname + '/compliance/corrupt');

    // Create a new BSON instance
    var bson = createBSON();

    for (var i = 0; i < scenarios.documents.length; i++) {
      var doc = scenarios.documents[i];
      if (doc.skip) continue;

      try {
        // Create a buffer containing the payload
        var buffer = new Buffer(doc.encoded, 'hex');
        // Attempt to deserialize
        bson.deserialize(buffer);
        expect(false).to.be.ok;
      } catch (err) {
        expect(true).to.be.ok;
      }
    }

    done();
  });

  /**
   * @ignore
   */
  it('Pass all valid BSON serialization scenarios ./compliance/valid.json', function(done) {
    // Read and parse the json file
    var scenarios = require(__dirname + '/compliance/valid');

    // Create a new BSON instance
    var bson = createBSON();

    // Translate extended json to correctly typed doc
    var translate = function(doc, object) {
      for (var name in doc) {
        if (
          typeof doc[name] === 'number' ||
          typeof doc[name] === 'string' ||
          typeof doc[name] === 'boolean'
        ) {
          object[name] = doc[name];
        } else if (Array.isArray(doc[name])) {
          object[name] = translate(doc[name], []);
        } else if (doc[name]['$numberLong']) {
          object[name] = Long.fromString(doc[name]['$numberLong']);
        } else if (doc[name]['$undefined']) {
          object[name] = null;
        } else if (doc[name]['$date']) {
          var date = new Date();
          date.setTime(parseInt(doc[name]['$date']['$numberLong'], 10));
          object[name] = date;
        } else if (doc[name]['$regexp']) {
          object[name] = new RegExp(doc[name]['$regexp'], doc[name]['$options'] || '');
        } else if (doc[name]['$oid']) {
          object[name] = new ObjectID(doc[name]['$oid']);
        } else if (doc[name]['$binary']) {
          object[name] = new Binary(doc[name]['$binary'], doc[name]['$type'] || 1);
        } else if (doc[name]['$timestamp']) {
          object[name] = Timestamp.fromBits(
            parseInt(doc[name]['$timestamp']['t'], 10),
            parseInt(doc[name]['$timestamp']['i'])
          );
        } else if (doc[name]['$ref']) {
          object[name] = new DBRef(doc[name]['$ref'], doc[name]['$id'], doc[name]['$db']);
        } else if (doc[name]['$minKey']) {
          object[name] = new MinKey();
        } else if (doc[name]['$maxKey']) {
          object[name] = new MaxKey();
        } else if (doc[name]['$code']) {
          object[name] = new Code(doc[name]['$code'], doc[name]['$scope'] || {});
        } else if (doc[name] != null && typeof doc[name] === 'object') {
          object[name] = translate(doc[name], {});
        }
      }

      return object;
    };

    // Iterate over all the results
    scenarios.documents.forEach(function(doc) {
      if (doc.skip) return;
      // Create a buffer containing the payload
      var expectedData = new Buffer(doc.encoded, 'hex');
      // Get the expectedDocument
      var expectedDocument = translate(doc.document, {});
      // Serialize to buffer
      var buffer = bson.serialize(expectedDocument);
      // Validate the output
      expect(expectedData.toString('hex')).to.equal(buffer.toString('hex'));
      // Attempt to deserialize
      var object = bson.deserialize(buffer, { promoteLongs: false });
      // // Validate the object
      expect(JSON.stringify(expectedDocument)).to.deep.equal(JSON.stringify(object));
    });

    done();
  });
});
