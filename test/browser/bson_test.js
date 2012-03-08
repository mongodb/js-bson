this.bson_test = {
    'test one': function (test) {
      var motherOfAllDocuments = {
        // 'string': '客家话',
        'array': [1,2,3],
        'hash': {'a':1, 'b':2},
        'date': new Date(),
        'oid': new ObjectID(),
        // 'binary': new Binary(data),
        'int': 42,
        'float': 33.3333,
        'regexp': /regexp/,
        'boolean': true,
        'long': Long.fromNumber(100),
        'where': new Code('this.a > i', {i:1}),        
        'dbref': new DBRef('namespace', new ObjectID(), 'integration_tests_'),
        'minkey': new MinKey(),
        'maxkey': new MaxKey()    
      }

      // Let's serialize it
      var data = BSON.serialize(motherOfAllDocuments, true, true, false);
      // Deserialize the object
      var object = BSON.deserialize(data);

      // Asserts
      test.equal(motherOfAllDocuments.string, object.string);
      test.deepEqual(motherOfAllDocuments.array, object.array);
      test.deepEqual(motherOfAllDocuments.date, object.date);
      test.deepEqual(motherOfAllDocuments.oid.toHexString(), object.oid.toHexString());
      // test.deepEqual(motherOfAllDocuments.binary.length(), object.binary.length());
      
      // // Assert the values of the binary
      // for(var i = 0; i < motherOfAllDocuments.binary.length(); i++) {
      //   test.equal(motherOfAllDocuments.binary.value[i], object.binary[i]);
      // }
      
      test.deepEqual(motherOfAllDocuments.int, object.int);
      test.deepEqual(motherOfAllDocuments.float, object.float);
      test.deepEqual(motherOfAllDocuments.regexp, object.regexp);
      test.deepEqual(motherOfAllDocuments.boolean, object.boolean);
      test.deepEqual(motherOfAllDocuments.long.toNumber(), object.long);
      test.deepEqual(motherOfAllDocuments.where, object.where);
      test.deepEqual(motherOfAllDocuments.dbref.oid.toHexString(), object.dbref.oid.toHexString());
      test.deepEqual(motherOfAllDocuments.dbref.namespace, object.dbref.namespace);
      test.deepEqual(motherOfAllDocuments.dbref.db, object.dbref.db);
      test.deepEqual(motherOfAllDocuments.minkey, object.minkey);
      test.deepEqual(motherOfAllDocuments.maxkey, object.maxkey);
      
      test.done();
    },
    
    // 'apples and oranges': function (test) {
    //     test.equal('apples', 'oranges', 'comparing apples and oranges');
    //     test.done();
    // }
};
