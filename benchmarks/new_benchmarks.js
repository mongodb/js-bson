var BSONNATIVE = require('../lib/bson').BSONNative.BSON,
	Long = require('../lib/bson').Long,
	ObjectID = require('../lib/bson').ObjectID,
	Binary = require('../lib/bson').Binary,
	Code = require('../lib/bson').Code,  
	DBRef = require('../lib/bson').DBRef,  
	Symbol = require('../lib/bson').Symbol,  
	Double = require('../lib/bson').Double,  
	MaxKey = require('../lib/bson').MaxKey,  
	MinKey = require('../lib/bson').MinKey,  
	Timestamp = require('../lib/bson').Timestamp;

var BSONJSOLD = require('../lib/bson').BSONPure.BSON
	, BSONJSNEW = require('../lib/bson/bson_new').BSON;

var varmUpCount = 10000;
var iterations = 40000;

var executeFunction = function(count, bson, object) {
	for(var i = 0; i < count; i++) {
		bson.serialize(object, true);
	}
}

var printResults = function(name, number, elapsed) {
	console.log("================================ TEST :: " + name);
	console.log("Iterations :: "+ number);
	console.log("Total time :: " + elapsed);
	console.log("Time pr. item :: " + (elapsed/number));
}

var executeBenchmark = function(_iterations, _name, _bson, _obj) {
	// Time the function
	var start = new Date();
	var b = executeFunction(_iterations, _bson, _obj);
	console.dir(b)
	var end = new Date();
	var timeElapsed = end.getTime() - start.getTime();
	// Print results
	printResults(_name, _iterations, timeElapsed);
}

// Parser instances
var bsonOld = new BSONJSOLD([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]);
var bsonNative = new BSONNATIVE([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]);
var bsonNew = new BSONJSNEW([Long, ObjectID, Binary, Code, DBRef, Symbol, Double, Timestamp, MaxKey, MinKey]);

// // var doc = {a:1, b: 3.4, c: "world", d: new Date(), e: /aa/, f:new Binary(new Buffer(256))}
// var doc = {a:1, b: 3.4, c: "world", d: new Date(), e: /aa/, f:new Binary(new Buffer(256))}
// // old bson
// executeFunction(varmUpCount, bsonOld, doc);
// executeFunction(varmUpCount, bsonNative, doc);
// executeFunction(varmUpCount, bsonNew, doc);

// iterations = 1
// // Execute benchmarks
// console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++ TEST 1")
// executeBenchmark(iterations, "BSONJSOLD", bsonOld, {a:1, "hello": "world", obj: {"dog": "days"}});
// executeBenchmark(iterations, "BSONNATIVE", bsonNative, {a:1, "hello": "world", obj: {"dog": "days"}});
// executeBenchmark(iterations, "BSONJSNEW", bsonNew, {a:1, "hello": "world", obj: {"dog": "days"}});
// console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++ TEST 2")
// executeBenchmark(iterations, "BSONJSOLD", bsonOld, {a:1, "hello": "world"});
// executeBenchmark(iterations, "BSONNATIVE", bsonNative, {a:1, "hello": "world"});
// executeBenchmark(iterations, "BSONJSNEW", bsonNew, {a:1, "hello": "world"});

// // var doc = {a:1, "hello": "world", obj: [{"dog": "days"}, {"dog": "days"}, {"dog": "days"}]};
// // var doc = {a:1, "hello": "world", obj: [1, 2, 3]};
// // var doc = {doc:[1]}
// var doc = {a:1, "hello": "world", obj: [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3]};
// iterations = 1
// console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++ TEST 3")
// executeBenchmark(iterations, "BSONJSOLD", bsonOld, doc);
// executeBenchmark(iterations, "BSONNATIVE", bsonNative, doc);
// executeBenchmark(iterations, "BSONJSNEW", bsonNew, doc);

// var doc = {a:1, b: 3.4, c: "world", d: new Date(), e: /aa/}//, f:new Binary(new Buffer(256))}
// console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++ TEST 4")
// executeBenchmark(iterations, "BSONJSOLD", bsonOld, doc);
// executeBenchmark(iterations, "BSONNATIVE", bsonNative, doc);
// executeBenchmark(iterations, "BSONJSNEW", bsonNew, doc);

var doc = {
  'string': 'hello',
  'array': [1,2,3],
  'hash': {'a':1, 'b':2},
  'date': new Date(),
  'oid': new ObjectID(),
  'binary': new Binary(new Buffer("hello")),
  'binary': new Buffer("hello"),
  'int': 42,
  'float': 33.3333,
  'regexp': /regexp/,
  'boolean': true,
  'long': Long.fromNumber(100),
  'where': new Code('this.a > i', {i:1}),        
  'dbref': new DBRef('namespace', new ObjectID(), 'integration_tests_'),
  'dbref': new DBRef('namespace', new ObjectID("000000000000000000000000")),
  'minkey': new MinKey(),
  'maxkey': new MaxKey()    
}

executeFunction(varmUpCount, bsonOld, doc);
executeFunction(varmUpCount, bsonNative, doc);
executeFunction(varmUpCount, bsonNew, doc);

console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++ TEST 4")
executeBenchmark(iterations, "BSONJSOLD", bsonOld, doc);
executeBenchmark(iterations, "BSONNATIVE", bsonNative, doc);
executeBenchmark(iterations, "BSONJSNEW", bsonNew, doc);
