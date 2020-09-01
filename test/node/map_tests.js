'use strict';

const BSON = require('../register-bson');
const M = BSON.Map;

describe('Map', function () {
  /**
   * @ignore
   */
  it('should correctly exercise the map', function (done) {
    var m = new M([
      ['a', 1],
      ['b', 2]
    ]);

    expect(m.has('a')).to.be.ok;
    expect(m.has('b')).to.be.ok;
    expect(1).to.equal(m.get('a'));
    expect(2).to.equal(m.get('b'));
    expect(m.set('a', 3) === m).to.be.ok;
    expect(m.has('a')).to.be.ok;
    expect(3).to.equal(m.get('a'));

    // Get the values
    var iterator = m.values();
    expect(3).to.equal(iterator.next().value);
    expect(2).to.equal(iterator.next().value);
    expect(true).to.equal(iterator.next().done);

    // Get the entries
    iterator = m.entries();
    expect(['a', 3]).to.deep.equal(iterator.next().value);
    expect(['b', 2]).to.deep.equal(iterator.next().value);
    expect(true).to.deep.equal(iterator.next().done);

    // Get the keys
    iterator = m.keys();
    expect('a').to.deep.equal(iterator.next().value);
    expect('b').to.deep.equal(iterator.next().value);
    expect(true).to.deep.equal(iterator.next().done);

    // Collect values
    var values = [];
    // Get entries forEach
    m.forEach(function (value, key, map) {
      expect(value != null).to.be.ok;
      expect(key != null).to.be.ok;
      expect(map != null).to.be.ok;
      expect(m === this).to.be.ok;
      values.push([key, value]);
    }, m);

    expect([
      ['a', 3],
      ['b', 2]
    ]).to.deep.equal(values);

    // Modify the state
    expect(true).to.equal(m.delete('a'));
    m.set('c', 5);
    m.set('a', 7);

    // Validate order is preserved
    // Get the keys
    iterator = m.keys();
    expect('b').to.deep.equal(iterator.next().value);
    expect('c').to.deep.equal(iterator.next().value);
    expect('a').to.deep.equal(iterator.next().value);
    expect(true).to.deep.equal(iterator.next().done);

    // Get the entries
    iterator = m.entries();
    expect(['b', 2]).to.deep.equal(iterator.next().value);
    expect(['c', 5]).to.deep.equal(iterator.next().value);
    expect(['a', 7]).to.deep.equal(iterator.next().value);
    expect(true).to.deep.equal(iterator.next().done);

    // Get the values
    iterator = m.values();
    expect(2).to.equal(iterator.next().value);
    expect(5).to.equal(iterator.next().value);
    expect(7).to.equal(iterator.next().value);
    expect(true).to.equal(iterator.next().done);
    done();
  });

  /**
   * @ignore
   */
  it('should serialize a map', function (done) {
    // Serialize top level map only
    var m = new M([
      ['a', 1],
      ['b', 2]
    ]);
    // Serialize the map
    var data = BSON.serialize(m, false, true);
    // Deserialize the data
    var object = BSON.deserialize(data);
    expect({ a: 1, b: 2 }).to.deep.equal(object);

    // Serialize nested maps
    var m1 = new M([
      ['a', 1],
      ['b', 2]
    ]);
    m = new M([['c', m1]]);
    // Serialize the map
    data = BSON.serialize(m, false, true);
    // Deserialize the data
    object = BSON.deserialize(data);
    expect({ c: { a: 1, b: 2 } }).to.deep.equal(object);
    done();

    // Serialize top level map only
    m = new M([
      ['1', 1],
      ['0', 2]
    ]);
    // Serialize the map, validating that the order in the resulting BSON is preserved
    data = BSON.serialize(m, false, true);
    expect('13000000103100010000001030000200000000').to.equal(data.toString('hex'));
  });

  /**
   * @ignore
   */
  it('should not crash due to object that looks like map', function (done) {
    // Serialize top level map only
    var m = { entries: 'test' };
    // Serialize the map
    var data = BSON.serialize(m, false, true);
    // Deserialize the data
    var object = BSON.deserialize(data);
    expect(m).to.deep.equal(object);
    done();
  });
});
