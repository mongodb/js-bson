var BSON = require('../');
var bson = new BSON([BSON.Binary, BSON.Code, BSON.DBRef, BSON.Decimal128,
  BSON.Double, BSON.Int32, BSON.Long, BSON.Map, BSON.MaxKey, BSON.MinKey,
  BSON.ObjectId, BSON.BSONRegExp, BSON.Symbol, BSON.Timestamp]);

function generateRecord(recnum) {
  // Definition of a 'Document'
  var topFields = 20; // 20 top level fields
  var arrObjSize = 10; // 10 fields in each array object
  var arrSize = 20; // Array of 20 elements
  var fldpfx = "val"

  //This is a shard friendly _id, a low cardinality, variable prefix then an incrementing value as string
  var id = (recnum % 256).toString() + "-" + recnum
  var rec = {
    _id: id,
    arr: []
  }

  for (var tf = 0; tf < topFields; tf++) {
    var fieldval
    switch (tf % 4) {
      case 0:
        fieldval = "Lorem ipsum dolor sit amet, consectetur adipiscing elit." //Text
        break
      case 1:
        fieldval = new Date(tf * recnum) //A date
        break
      case 2:
        fieldval = Math.PI * tf // A float
        break
      case 3:
        fieldval = BSON.Long(recnum + tf) // A 64 bit integer
        break
    }
    // fieldval = Math.PI * tf // A float
    // fieldval = new Date(tf * recnum) //A date
    // fieldval = "Lorem ipsum dolor sit amet, consectetur adipiscing elit." //Text
    // fieldval = BSON.Long(recnum + tf) // A 64 bit integer
    rec[fldpfx + tf] = fieldval
  }

  // populate array of subdocuments
  for (var el = 0; el < arrSize; el++) {
    var subrec = {}
    for (var subRecField = 0; subRecField < arrObjSize; subRecField++) {
      var fieldval
      switch (subRecField % 4) {
        case 0:
          fieldval = "Nunc finibus pretium dignissim. Aenean ut nisi finibus"
          break
        case 1:
          fieldval = new Date(tf * recnum * el)
          break
        case 2:
          fieldval = Math.PI * tf * el
          break
        case 3:
          fieldval = BSON.Long(recnum + tf * el)
          break
      }
      // fieldval = Math.PI * tf * el;
      // fieldval = new Date(tf * recnum * el)
      // fieldval = "Nunc finibus pretium dignissim. Aenean ut nisi finibus"
      // fieldval = BSON.Long(recnum + tf * el)
      subrec['subval' + subRecField] = fieldval
    }
    rec['arr'].push(subrec)
  }

  return rec
}

var start = new Date();
var iterations = 100000;
var iterations = 10000;
var doc = generateRecord(0)
var buffer = bson.serialize(doc);

//
// Serialize
//
for(var i = 0; i < iterations; i++) {
  bson.serialize(doc);
}

var end = new Date();
console.log("======================== Serialization total time MS");
console.log("totalMS = " + (end.getTime() - start.getTime()));

//
// Deserialize
//
var start = new Date();

for(var i = 0; i < iterations; i++) {
  bson.deserialize(buffer);
}

var end = new Date();
console.log("======================== Deserialization total time MS");
console.log("totalMS = " + (end.getTime() - start.getTime()));
