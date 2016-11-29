"use strict"

var bson = require('../');
var Binary = bson.Binary
  , Long = bson.Long
  , MaxKey = bson.MaxKey
  , MinKey = bson.MinKey
  , BSONRegExp = bson.BSONRegExp
  , Timestamp = bson.Timestamp
  , ObjectId = bson.ObjectId
  , Code = bson.Code
  , Decimal128 = bson.Decimal128;

var serialize = function(document) {
  if(document && typeof document == 'object') {
    var doc = {};
    var keys = Object.keys(document);
    if(keys.length == 0) return {};

    // for(var name in document) {
    for(var i = 0; i < keys.length; i++) {
      var name = keys[i];

      if(Array.isArray(document[name])) {
        // Create a new array
        doc[name] = new Array(document[name].length);
        // Process all the items
        for(var i = 0; i < document[name].length; i++) {
          doc[name][i] = serialize(document[name][i]);
        }
      } else if(document[name] && typeof document[name] == 'object') {
        if(document[name] instanceof Binary || document[name]._bsontype == 'Binary') {
          doc[name] = {
            '$binary': document[name].buffer.toString('base64'), '$type': new Buffer([document[name].sub_type]).toString('hex')
          };
        } else if(document[name] instanceof Code || document[name]._bsontype == 'Code') {
          doc[name] = { '$code': document[name].code };
          if(document[name].scope) doc[name]['$scope'] = document[name].scope;
        } else if(document[name] instanceof Date) {
          doc[name] = { '$date': document[name].toISOString() };
        } else if(document[name] instanceof Long || document[name]._bsontype == 'Long') {
          doc[name] = { '$numberLong': document[name].toString() };
        } else if(document[name] instanceof MaxKey || document[name]._bsontype == 'MaxKey') {
          doc[name] = { '$maxKey': true };
        } else if(document[name] instanceof MinKey || document[name]._bsontype == 'MinKey') {
          doc[name] = { '$minKey': true };
        } else if(document[name] instanceof ObjectId || document[name]._bsontype == 'ObjectID') {
          doc[name] = { '$oid': document[name].toString() };
        } else if(document[name] instanceof BSONRegExp) {
          doc[name] = { '$regex': document[name].pattern, '$options': document[name].options };
        } else if(document[name] instanceof Timestamp || document[name]._bsontype == 'Timestamp') {
          doc[name] = { '$timestamp': { t: document[name].high_ , i: document[name].low_ }};
        } else if(document[name] instanceof Decimal128 || document[name]._bsontype == 'Decimal128') {
          doc[name] = { '$numberDecimal': document[name].toString() };
        } else if(document[name] === undefined) {
          doc[name] = { '$undefined': true };
        } else {
          doc[name] = serialize(document[name]);
        }
      } else {
        doc[name] = document[name];
      }
    }

    return doc;
  }

  return document;
}

var deserialize = function(document) {
  if(document && typeof document == 'object') {
    var doc = {};

    for(var name in document) {
      if(Array.isArray(document[name])) {
        // Create a new array
        doc[name] = new Array(document[name].length);
        // Process all the items
        for(var i = 0; i < document[name].length; i++) {
          doc[name][i] = deserialize(document[name][i]);
        }
      } else if(document[name] && typeof document[name] == 'object') {
        if(document[name]['$binary'] != undefined) {
          var buffer = new Buffer(document[name]['$binary'], 'base64');
          var type = new Buffer(document[name]['$type'], 'hex')[0];
          doc[name] = new Binary(buffer, type);
        } else if(document[name]['$code'] != undefined) {
          var code = document[name]['$code'];
          var scope = document[name]['$scope'];
          doc[name] = new Code(code, scope);
        } else if(document[name]['$date'] != undefined) {
          if(typeof document[name]['$date'] == 'string') {
            doc[name] = new Date(document[name]['$date']);
          } else if(typeof document[name]['$date'] == 'object'
            && document[name]['$date']['$numberLong']) {
              var time = parseInt(document[name]['$date']['$numberLong'], 10);
              var date = new Date();
              date.setTime(time);
              doc[name] = date;
          }
        } else if(document[name]['$numberLong'] != undefined) {
          doc[name] = Long.fromString(document[name]['$numberLong']);
        } else if(document[name]['$maxKey'] != undefined) {
          doc[name] = new MaxKey();
        } else if(document[name]['$minKey'] != undefined) {
          doc[name] = new MinKey();
        } else if(document[name]['$oid'] != undefined) {
          doc[name] = new ObjectId(new Buffer(document[name]['$oid'], 'hex'));
        } else if(document[name]['$regex'] != undefined) {
          doc[name] = new BSONRegExp(document[name]['$regex'], document[name]['$options'])
        } else if(document[name]['$timestamp'] != undefined) {
          doc[name] = new Timestamp(document[name]['$timestamp'].i, document[name]['$timestamp'].t);
        } else if(document[name]['$numberDecimal'] != undefined) {
          doc[name] = new Decimal128.fromString(document[name]['$numberDecimal']);
        } else if(document[name]['$undefined'] != undefined) {
          doc[name] = undefined;
        } else {
          doc[name] = deserialize(document[name]);
        }
      } else {
        doc[name] = document[name];
      }
    }

    return doc;
  }

  return document;
}

module.exports = {
  deserialize: deserialize,
  serialize: serialize
}
