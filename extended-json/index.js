"use strict"

var bson = require('../lib/bson');
var Binary = bson.Binary;

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
        // console.log("!!!!!!!!!!!! --- object")
        // console.dir(document[name])
        if(document[name]['$binary'] != undefined) {
          var buffer = new Buffer(document[name]['$binary'], 'base64');
          var type = new Buffer(document[name]['$type'], 'hex')[0];
          doc[name] = new Binary(buffer, type);
        }


        // if(document[name].)
      } else {
        doc[name] = document[name];
      }
    }

    return doc;
  }

  return document;
}

module.exports = {
  deserialize: deserialize
}
