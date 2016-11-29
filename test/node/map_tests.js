var M = require('../../lib/bson/map');
var createBSON = require('../utils');

/**
 * @ignore
 */
exports['should correctly exercise the map'] = function(test) {
  var m = new M([['a', 1], ['b', 2]]);
  test.ok(m.has('a'));
  test.ok(m.has('b'));
  test.equal(1, m.get('a'));
  test.equal(2, m.get('b'));
  test.ok(m.set('a', 3) === m);
  test.ok(m.has('a'));
  test.equal(3, m.get('a'));

  // Get the values
  var iterator = m.values();
  test.equal(3, iterator.next().value);
  test.equal(2, iterator.next().value);
  test.equal(true, iterator.next().done);

  // Get the entries
  var iterator = m.entries();
  test.deepEqual(['a', 3], iterator.next().value);
  test.deepEqual(['b', 2], iterator.next().value);
  test.deepEqual(true, iterator.next().done);

  // Get the keys
  var iterator = m.keys();
  test.deepEqual('a', iterator.next().value);
  test.deepEqual('b', iterator.next().value);
  test.deepEqual(true, iterator.next().done);

  // Collect values
  var values = [];
  // Get entries forEach
  m.forEach(function(value, key, map) {
    test.ok(value != null);
    test.ok(key != null);
    test.ok(map != null);
    test.ok(m === this);
    values.push([key, value]);
  }, m);

  test.deepEqual([['a', 3], ['b', 2]], values);

  // Modify the state
  test.equal(true, m.delete('a'));
  m.set('c', 5);
  m.set('a', 7);

  // Validate order is preserved
  // Get the keys
  var iterator = m.keys();
  test.deepEqual('b', iterator.next().value);
  test.deepEqual('c', iterator.next().value);
  test.deepEqual('a', iterator.next().value);
  test.deepEqual(true, iterator.next().done);

  // Get the entries
  var iterator = m.entries();
  test.deepEqual(['b', 2], iterator.next().value);
  test.deepEqual(['c', 5], iterator.next().value);
  test.deepEqual(['a', 7], iterator.next().value);
  test.deepEqual(true, iterator.next().done);

  // Get the values
  var iterator = m.values();
  test.equal(2, iterator.next().value);
  test.equal(5, iterator.next().value);
  test.equal(7, iterator.next().value);
  test.equal(true, iterator.next().done);
  test.done();
}

/**
 * @ignore
 */
exports['should serialize a map'] = function(test) {
  // Serialize top level map only
  var m = new M([['a', 1], ['b', 2]]);
  var bson = createBSON();
  // Serialize the map
  var data = bson.serialize(m, false, true);
  // Deserialize the data
  var object = bson.deserialize(data);
  test.deepEqual({a:1, b:2}, object);

  // Serialize nested maps
  var m1 = new M([['a', 1], ['b', 2]]);
  var m = new M([['c', m1]]);
  // Serialize the map
  var data = bson.serialize(m, false, true);
  // Deserialize the data
  var object = bson.deserialize(data);
  test.deepEqual({c: {a:1, b:2} }, object);
  test.done();

  // Serialize top level map only
  var m = new M([['1', 1], ['0', 2]]);
  var bson = createBSON();
  // Serialize the map, validating that the order in the resulting BSON is preserved
  var data = bson.serialize(m, false, true);
  test.equal('13000000103100010000001030000200000000', data.toString('hex'));
}
