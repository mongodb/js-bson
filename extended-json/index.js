"use strict"

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
      } else if(!document[name] && typeof document[name] == 'object') {
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
