'use strict';

const BSON = require('../register-bson');
const { ObjectId, __isWeb__ } = BSON;

describe('toBSON', function () {
  /**
   * @ignore
   */
  it('Should correctly handle toBson function for an object', function (done) {
    // Test object
    var doc = {
      hello: new ObjectId(),
      a: 1
    };

    // Add a toBson method to the object
    doc.toBSON = function () {
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
  it('Should correctly handle embedded toBson function for an object', function (done) {
    // Test object
    var doc = {
      hello: new ObjectId(),
      a: 1,
      b: {
        d: 1
      }
    };

    // Add a toBson method to the object
    doc.b.toBSON = function () {
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
  it('Should correctly serialize when embedded non object returned by toBSON', function (done) {
    // Test object
    var doc = {
      hello: new ObjectId(),
      a: 1,
      b: {
        d: 1
      }
    };

    // Add a toBson method to the object
    doc.b.toBSON = function () {
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
  it('Should fail when top level object returns a non object type', function (done) {
    // Test object
    var doc = {
      hello: new ObjectId(),
      a: 1,
      b: {
        d: 1
      }
    };

    // Add a toBson method to the object
    doc.toBSON = function () {
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

  describe('when used on global existing types', () => {
    beforeEach(function () {
      if (__isWeb__) {
        // These prototype modification do not make it
        // to the BSON lib that was run in a separate context
        return this.skip();
      }
      Number.prototype.toBSON = () => `hello ${typeof 0}`;
      String.prototype.toBSON = () => `hello ${typeof ''}`;
      Boolean.prototype.toBSON = () => `hello ${typeof false}`;
      BigInt.prototype.toBSON = () => `hello ${typeof 0n}`;
    });

    afterEach(() => {
      // remove prototype extension intended for test
      delete Number.prototype.toBSON;
      delete String.prototype.toBSON;
      delete Boolean.prototype.toBSON;
      delete BigInt.prototype.toBSON;
    });

    const testToBSONFor = value => {
      it(`should use toBSON on false-y ${typeof value} ${value === '' ? "''" : value}`, () => {
        const expectedString = `hello ${typeof value}`;
        const serialized_data = BSON.serialize({ a: value });
        expect(
          serialized_data.indexOf(Buffer.from(expectedString + '\0', 'utf8'))
        ).to.be.greaterThan(0);

        const deserialized_doc = BSON.deserialize(serialized_data);
        expect(deserialized_doc).to.have.property('a', expectedString);
      });
    };

    testToBSONFor(0);
    testToBSONFor(NaN);
    testToBSONFor('');
    testToBSONFor(false);
    testToBSONFor(0n);

    it('should use toBSON on false-y number in calculateObjectSize', () => {
      // Normally is 20 bytes
      // int32 0x04 'a\x00'
      //   int32 0x10 '0\x00' int32 \0
      // \0
      // ---------
      // with toBSON is 33 bytes (hello number + null)
      // int32 0x04 'a\x00'
      //   int32 0x02 '0\x00' int32 'hello number\0' \0
      // \0
      const sizeNestedToBSON = BSON.calculateObjectSize({ a: [0] });
      expect(sizeNestedToBSON).to.equal(33);
    });
  });

  it('should use toBSON in calculateObjectSize', () => {
    const sizeTopLvlToBSON = BSON.calculateObjectSize({ toBSON: () => ({ a: 1 }) });
    const sizeOfWhatToBSONReturns = BSON.calculateObjectSize({ a: 1 });
    expect(sizeOfWhatToBSONReturns).to.equal(12);
    expect(sizeTopLvlToBSON).to.equal(12);

    const toBSONAsAKeySize = BSON.calculateObjectSize({ toBSON: { a: 1 } });
    expect(toBSONAsAKeySize).to.equal(25);
  });

  it('should serialize to a key for non-function values', () => {
    // int32 0x10 'toBSON\x00' int32 \0
    const size = BSON.calculateObjectSize({ toBSON: 1 });
    expect(size).to.equal(17);

    const bytes = BSON.serialize({ toBSON: 1 });
    const keyStart = 5;
    const keyEnd = 12;
    const serializedKey = bytes.subarray(keyStart, keyEnd);
    expect(serializedKey).to.deep.equal(Buffer.from('toBSON\0', 'utf8'));
  });

  it('should still be omitted if serializeFunctions is true', () => {
    const bytes = BSON.serialize(
      { toBSON: () => ({ a: 1, fn: () => ({ a: 1 }) }) },
      { serializeFunctions: true }
    );
    expect(bytes.indexOf(97)).to.be.greaterThan(0);
    const doc = BSON.deserialize(bytes);
    expect(doc).to.have.property('a', 1);
    expect(doc).to.have.property('fn').that.is.instanceOf(BSON.Code);
  });
});
