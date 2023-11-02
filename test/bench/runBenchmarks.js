'use strict';

const { Suite } = require('bson-bench');
const path = require('path');
const fs = require('fs/promises');

const BSON_VERSIONS = [`bson@6`, `bson@5`, 'bson@4'];
const BSONEXT_VERSIONS = ['bson-ext@4.0.0'];
const DOCUMENT_ROOT = './documents';
const OPERATIONS = ['serialize', 'deserialize'];
const BOOL = [true, false];
const ITERATIONS = 10_000;
const WARMUP = 10_000;

const OPTIONS = {
  int32: {
    serialize: { checkKeys: true, ignoreUndefined: false },
    deserialize: {
      promoteValues: true,
      index: 0,
      evalFunctions: false,
      cacheFunctions: false,
      allowObjectSmallerThanBufferSize: false
    }
  },
  long: {
    serialize: {},
    deserialize: {}
  },
  double: {
    serialize: { checkKeys: true, ignoreUndefined: false },
    deserialize: {
      promoteValues: true
    }
  },
  decimal128: {
    serialize: { checkKeys: true, ignoreUndefined: false },
    deserialize: {
      index: 0,
      evalFunctions: false,
      cacheFunctions: false,
      allowObjectSmallerThanBufferSize: false
    }
  },
  boolean: {
    serialize: { checkKeys: true, ignoreUndefined: false },
    deserialize: {
      promoteValues: true,
      index: 0
    }
  }
};

const isDeserialize = s => s === 'deserialize';
async function getTestDocs(type) {
  const docs = ['singleFieldDocument', 'singleElementArray'].map(testType =>
    path.join(DOCUMENT_ROOT, `${type}_${testType}.json`)
  );

  const dir = await fs.opendir(DOCUMENT_ROOT);
  for await (const entry of dir) {
    // Get array and sized docs
    if (/_array_\d+\.json/.test(entry.name) || /_(small|medium|large)\.json/.test(entry.name)) {
      docs.push(path.join(DOCUMENT_ROOT, entry.name));
    }
  }

  // Get sized docs

  return docs;
}

const int32Suite = new Suite('Int32');

const longJSBSONDeserializationOptions = [
  {
    useBigInt64: false,
    promoteValues: false,
    promoteLongs: false
  },
  {
    useBigInt64: false,
    promoteValues: true,
    promoteLongs: true
  },
  {
    useBigInt64: true
  }
];
const longJSBSONSerializationOptions = [];

const longBSONEXTDeserializationOptions = [
  {
    promoteValues: false,
    promoteLongs: false
  },
  {
    promoteValues: true,
    promoteLongs: true
  }
];
const longBSONEXTSerializationOptions = [];

const longSuite = new Suite('Long');

const doubleSuite = new Suite('Double');
const decimal128Suite = new Suite('Decimal128');
const booleanSuite = new Suite('Boolean');
const mixedDocuments = [
  'tweet.json',
  'bestbuy.json',
  'deep_bson.json',
  'flat_bson.json',
  'full_bson.json'
];
const mixedSuite = new Suite('Mixed');

const miscSuiteNames = ['MinKey', 'MaxKey', 'Null', 'ObjectId', 'Timestamp', 'RegEx'];
const miscSuites = miscSuiteNames.map(type => {
  const suite = new Suite(type);
  for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
    for (const documentPath of getTestDocs(type.toLowerCase())) {
      for (const operation of OPERATIONS) {
        suite.task({
          documentPath,
          library,
          iterations: ITERATIONS,
          warmup: WARMUP,
          operation,
          options: {}
        });
      }
    }
  }
  return suite;
});
const codeSuite = new Suite('Code');

for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
  for (const operation of OPERATIONS) {
    // INT32 TESTS
    for (const documentPath of getTestDocs('int32')) {
      for (const promoteValues of BOOL) {
        int32Suite.task({
          documentPath,
          library,
          iterations: ITERATIONS,
          warmup: WARMUP,
          operation,
          options: isDeserialize(operation)
            ? { ...OPTIONS['int32'][operation], promoteValues }
            : OPTIONS['int32'][operation]
        });
      }
    }
    // DOUBLE TESTS
    for (const documentPath of getTestDocs('double')) {
      for (const promoteValues of BOOL) {
        doubleSuite.task({
          documentPath,
          library,
          iterations: ITERATIONS,
          warmup: WARMUP,
          operation,
          options:
            operation === 'deserialize'
              ? { ...OPTIONS['double'][operation], promoteValues }
              : OPTIONS['double'][operation]
        });
      }
    }

    // DECIMAL128 TESTS
    for (const documentPath of getTestDocs('decimal128')) {
      decimal128Suite.task({
        documentPath,
        library,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation,
        options: OPTIONS['decimal128'][operation]
      });
    }

    // BOOLEAN TESTS
    for (const documentPath of getTestDocs('boolean')) {
      for (const promoteValues of BOOL) {
        booleanSuite.task({
          documentPath,
          library,
          iterations: ITERATIONS,
          warmup: WARMUP,
          operation,
          options:
            operation === 'deserialize'
              ? { ...OPTIONS['boolean'][operation], promoteValues }
              : OPTIONS['boolean'][operation]
        });
      }
    }

    // MIXED DOCUMENT TESTS
    for (const documentPath of mixedDocuments.map(d => path.join(DOCUMENT_ROOT, d))) {
      mixedSuite.task({
        documentPath,
        library,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation,
        options: {}
      });
    }

    // CODE TESTS
    for (const documentPath of getTestDocs('code-without-scope').concat(
      getTestDocs('code-with-scope')
    )) {
      codeSuite.task({
        documentPath,
        library,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation,
        options: {}
      });
    }
  }
}

// LONG JS-BSON Deserialization tests
for (const library of BSON_VERSIONS) {
  for (const documentPath of getTestDocs('long')) {
    for (const options of longJSBSONDeserializationOptions) {
      longSuite.task({
        documentPath,
        library,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'deserialize',
        options
      });
    }
  }
}

// LONG JS-BSON Serialization tests
for (const library of BSON_VERSIONS) {
  for (const documentPath of getTestDocs('long')) {
    for (const options of longJSBSONSerializationOptions) {
      longSuite.task({
        documentPath,
        library,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'serialize',
        options
      });
    }
  }
}

// LONG BSON-EXT Deserialization tests
for (const library of BSONEXT_VERSIONS) {
  for (const documentPath of getTestDocs('long')) {
    for (const options of longBSONEXTDeserializationOptions) {
      longSuite.task({
        documentPath,
        library,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'deserialize',
        options
      });
    }
  }
}

// LONG BSON-EXT Serialization tests
for (const library of BSONEXT_VERSIONS) {
  for (const documentPath of getTestDocs('long')) {
    for (const options of longBSONEXTSerializationOptions) {
      longSuite.task({
        documentPath,
        library,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'serialize',
        options
      });
    }
  }
}

(async () => {
  await booleanSuite.run();
  await booleanSuite.writeResults('booleanResults.json');

  for (const i in miscSuites) {
    await miscSuites[i].run();
    await miscSuites[i].writeResults(`${miscSuiteNames[i].toLowerCase()}Results.json`);
  }
})();
