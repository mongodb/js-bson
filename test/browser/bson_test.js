this.bson_test = {
    'test one': function (test) {
      // var motherOfAllDocuments = {
      //   // 'string': '客家话',
      //   'array': [1,2,3],
      //   'hash': {'a':1, 'b':2},
      //   'date': new Date(),
      //   'oid': new ObjectID(),
      //   // 'binary': new Binary(data),
      //   'int': 42,
      //   'float': 33.3333,
      //   'regexp': /regexp/,
      //   'boolean': true,
      //   'long': Long.fromNumber(100),
      //   'where': new Code('this.a > i', {i:1}),        
      //   'dbref': new DBRef('namespace', new ObjectID(), 'integration_tests_'),
      //   'minkey': new MinKey(),
      //   'maxkey': new MaxKey()    
      // }
      // 
      // // Let's serialize it
      // var data = BSON.serialize(motherOfAllDocuments, true, true, false);
      // // Deserialize the object
      // var object = BSON.deserialize(data);
      // 
      // // Asserts
      // test.equal(motherOfAllDocuments.string, object.string);
      // test.deepEqual(motherOfAllDocuments.array, object.array);
      // test.deepEqual(motherOfAllDocuments.date, object.date);
      // test.deepEqual(motherOfAllDocuments.oid.toHexString(), object.oid.toHexString());
      // // test.deepEqual(motherOfAllDocuments.binary.length(), object.binary.length());
      // 
      // // // Assert the values of the binary
      // // for(var i = 0; i < motherOfAllDocuments.binary.length(); i++) {
      // //   test.equal(motherOfAllDocuments.binary.value[i], object.binary[i]);
      // // }
      // 
      // test.deepEqual(motherOfAllDocuments.int, object.int);
      // test.deepEqual(motherOfAllDocuments.float, object.float);
      // test.deepEqual(motherOfAllDocuments.regexp, object.regexp);
      // test.deepEqual(motherOfAllDocuments.boolean, object.boolean);
      // test.deepEqual(motherOfAllDocuments.long.toNumber(), object.long);
      // test.deepEqual(motherOfAllDocuments.where, object.where);
      // test.deepEqual(motherOfAllDocuments.dbref.oid.toHexString(), object.dbref.oid.toHexString());
      // test.deepEqual(motherOfAllDocuments.dbref.namespace, object.dbref.namespace);
      // test.deepEqual(motherOfAllDocuments.dbref.db, object.dbref.db);
      // test.deepEqual(motherOfAllDocuments.minkey, object.minkey);
      // test.deepEqual(motherOfAllDocuments.maxkey, object.maxkey);
      
      test.done();
    },
    
    'exercise all the binary object constructor methods': function (test) {
      // Construct using array
      var string = 'hello world';
      // String to array
      var array = stringToArrayBuffer(string);

      // Binary from array buffer
      var binary = new Binary(stringToArrayBuffer(string));
      test.ok(string.length, binary.buffer.length);
      test.deepEqual(array, binary.buffer);
      
      // Construct using number of chars
      binary = new Binary(5);
      test.ok(5, binary.buffer.length);
      
      // Construct using an Array
      var binary = new Binary(stringToArray(string));
      test.ok(string.length, binary.buffer.length);
      test.deepEqual(array, binary.buffer);
      
      // Construct using a string
      var binary = new Binary(string);
      test.ok(string.length, binary.buffer.length);
      test.deepEqual(array, binary.buffer);      
      test.done();
    },

    'exercise the put binary object method for an instance when using Uint8Array': function (test) {
      // Construct using array
      var string = 'hello world';
      // String to array
      var array = stringToArrayBuffer(string + 'a');
      
      // Binary from array buffer
      var binary = new Binary(stringToArrayBuffer(string));
      test.ok(string.length, binary.buffer.length);

      // Write a byte to the array
      binary.put('a')

      // Verify that the data was writtencorrectly
      test.equal(string.length + 1, binary.position);
      test.deepEqual(array, binary.value(true));
      test.equal('hello worlda', binary.value());

      // Exercise a binary with lots of space in the buffer
      var binary = new Binary();
      test.ok(Binary.BUFFER_SIZE, binary.buffer.length);

      // Write a byte to the array
      binary.put('a')

      // Verify that the data was writtencorrectly
      test.equal(1, binary.position);
      test.deepEqual(['a'.charCodeAt(0)], binary.value(true));
      test.equal('a', binary.value());
      test.done();
    },
    
    'exercise the write binary object method for an instance when using Uint8Array': function (test) {
      // Construct using array
      var string = 'hello world';
      // Array
      var writeArrayBuffer = new Uint8Array(new ArrayBuffer(1));
      writeArrayBuffer[0] = 'a'.charCodeAt(0);
      var arrayBuffer = ['a'.charCodeAt(0)];
      
      // Binary from array buffer
      var binary = new Binary(stringToArrayBuffer(string));
      test.ok(string.length, binary.buffer.length);

      // Write a string starting at end of buffer
      binary.write('a');
      test.equal('hello worlda', binary.value());
      // Write a string starting at index 0
      binary.write('a', 0);
      test.equal('aello worlda', binary.value());
      // Write a arraybuffer starting at end of buffer
      binary.write(writeArrayBuffer);
      test.equal('aello worldaa', binary.value());
      // Write a arraybuffer starting at position 5
      binary.write(writeArrayBuffer, 5);
      test.equal('aelloaworldaa', binary.value());
      // Write a array starting at end of buffer
      binary.write(arrayBuffer);
      test.equal('aelloaworldaaa', binary.value());
      // Write a array starting at position 6
      binary.write(arrayBuffer, 6);
      test.equal('aelloaaorldaaa', binary.value());
      test.done();
    },
    
    'exercise the read binary object method for an instance when using Uint8Array': function (test) {      
      // Construct using array
      var string = 'hello world';
      var array = stringToArrayBuffer(string);

      // Binary from array buffer
      var binary = new Binary(stringToArrayBuffer(string));
      test.ok(string.length, binary.buffer.length);
      
      // Read the first 2 bytes
      var data = binary.read(0, 2);
      test.deepEqual(stringToArrayBuffer('he'), data);

      // Read the entire field
      var data = binary.read(0);
      test.deepEqual(stringToArrayBuffer(string), data);

      // Read 3 bytes
      var data = binary.read(6, 5);
      test.deepEqual(stringToArrayBuffer('world'), data);
      test.done();
    }    
};

// String to arraybuffer
var stringToArrayBuffer = function(string) {
  var dataBuffer = new Uint8Array(new ArrayBuffer(string.length));
  // Return the strings
  for(var i = 0; i < string.length; i++) {
    dataBuffer[i] = string.charCodeAt(i);
  }
  // Return the data buffer
  return dataBuffer;
}

// String to arraybuffer
var stringToArray = function(string) {
  var dataBuffer = new Array(string.length);
  // Return the strings
  for(var i = 0; i < string.length; i++) {
    dataBuffer[i] = string.charCodeAt(i);
  }
  // Return the data buffer
  return dataBuffer;
}
