'use strict';

const BSON = require('../../lib/bson');
const ObjectId = BSON.ObjectId;
const expect = require('chai').expect;

describe('toBSON', function() {
  /**
   * @ignore
   */
  it('Should correctly handle toBson function for an object', function(done) {
    // Test object
    var doc = {
      hello: new ObjectId(),
      a: 1
    };

    // Add a toBson method to the object
    doc.toBSON = function() {
      return { b: 1 };
    };

    // Serialize the data
    var serialized_data = BSON.serialize(doc, false, true);
    var deserialized_doc = BSON.deserialize(serialized_data);
    expect({ b: 1 }).to.deep.equal(deserialized_doc);

    // Serialize the data
    serialized_data = BSON.serialize(doc, false, true);
    deserialized_doc = BSON.deserialize(serialized_data);
    expect({ b: 1 }).to.deep.equal(deserialized_doc);
    done();
  });

  /**
   * @ignore
   */
  it('Should correctly handle embedded toBson function for an object', function(done) {
    // Test object
    var doc = {
      hello: new ObjectId(),
      a: 1,
      b: {
        d: 1
      }
    };

    // Add a toBson method to the object
    doc.b.toBSON = function() {
      return { e: 1 };
    };

    // Serialize the data
    var serialized_data = BSON.serialize(doc, false, true);
    var deserialized_doc = BSON.deserialize(serialized_data);
    expect({ e: 1 }).to.deep.equal(deserialized_doc.b);

    serialized_data = BSON.serialize(doc, false, true);
    deserialized_doc = BSON.deserialize(serialized_data);
    expect({ e: 1 }).to.deep.equal(deserialized_doc.b);
    done();
  });

  /**
   * @ignore
   */
  it('Should correctly serialize when embedded non object returned by toBSON', function(done) {
    // Test object
    var doc = {
      hello: new ObjectId(),
      a: 1,
      b: {
        d: 1
      }
    };

    // Add a toBson method to the object
    doc.b.toBSON = function() {
      return 'hello';
    };

    // Serialize the data
    var serialized_data = BSON.serialize(doc, false, true);
    var deserialized_doc = BSON.deserialize(serialized_data);
    expect('hello').to.deep.equal(deserialized_doc.b);

    // Serialize the data
    serialized_data = BSON.serialize(doc, false, true);
    deserialized_doc = BSON.deserialize(serialized_data);
    expect('hello').to.deep.equal(deserialized_doc.b);
    done();
  });

  /**
   * @ignore
   */
  it('Should fail when top level object returns a non object type', function(done) {
    // Test object
    var doc = {
      hello: new ObjectId(),
      a: 1,
      b: {
        d: 1
      }
    };

    // Add a toBson method to the object
    doc.toBSON = function() {
      return 'hello';
    };

    var test1 = false;
    var test2 = false;

    try {
      var serialized_data = BSON.serialize(doc, false, true);
      BSON.deserialize(serialized_data);
    } catch (err) {
      test1 = true;
    }

    try {
      serialized_data = BSON.serialize(doc, false, true);
      BSON.deserialize(serialized_data);
    } catch (err) {
      test2 = true;
    }

    expect(true).to.equal(test1);
    expect(true).to.equal(test2);
    done();
  });
});
