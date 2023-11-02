import { Suite } from 'bson-bench';
import * as path from 'path';
import * as fs from 'fs/promises';

const DOCUMENT_ROOT = `${__dirname}/documents`;
const isDeserialize = (s: string) => s === 'deserialize';
async function getTestDocs(type: string) {
  const docs = ['singleFieldDocument', 'singleElementArray'].map(testType =>
    path.join(DOCUMENT_ROOT, `${type}_${testType}.json`)
  );

  const dir = await fs.opendir(DOCUMENT_ROOT);
  const arrayRegex = new RegExp(`${type}_array_\\d+\\.json`);
  const sizedRegex = new RegExp(`${type}_(small|medium|large)\\.json`);
  for await (const entry of dir) {
    // Get array and sized docs
    if (arrayRegex.test(entry.name) || sizedRegex.test(entry.name)) {
      docs.push(path.join(DOCUMENT_ROOT, entry.name));
    }
  }

  console.log(docs);
  return docs;
}

async function runSuiteAndWriteResults(suite: Suite) {
  await suite.run();
  await suite.writeResults(`${suite.name.toLowerCase()}Results.json`);
}

describe('Benchmarks', function () {
  this.timeout(600_000); // 5 minutes

  const BSON_VERSIONS = [`bson@6`, `bson@5`, 'bson@4'];
  const BSONEXT_VERSIONS = ['bson-ext@4.0.0'];
  const OPERATIONS: ('serialize' | 'deserialize')[] = ['serialize', 'deserialize'];
  const BOOL = [true, false];
  const ITERATIONS = 10_000;
  const WARMUP = 1000;

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
  describe('Binary', function () {
    const suite = new Suite('Binary');

    before(async function () {
      const testDocs = await getTestDocs('binary');
      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
            for (const promoteBuffers of BOOL) {
              suite.task({
                documentPath,
                library,
                iterations: ITERATIONS,
                warmup: WARMUP,
                operation,
                options: {
                  promoteBuffers
                }
              });
            }
          }
        }
      }
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });
  describe('Boolean', function () {
    const suite = new Suite('Boolean');

    before(async function () {
      const testDocs = await getTestDocs('boolean');
      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
            for (const promoteValues of BOOL) {
              suite.task({
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
        }
      }
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });

  describe('Int32', function () {
    const suite = new Suite('Int32');

    before(async function () {
      const testDocs = await getTestDocs('int32');
      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
            for (const promoteValues of BOOL) {
              suite.task({
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
        }
      }
    });

    it('runs', runSuiteAndWriteResults.bind(suite));
  });

  describe('Long', function () {
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
    before(async function () {
      const testDocs = await getTestDocs('long');
      // LONG JS-BSON Deserialization tests
      for (const library of BSON_VERSIONS) {
        for (const documentPath of testDocs) {
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
        for (const documentPath of testDocs) {
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
        for (const documentPath of testDocs) {
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
        for (const documentPath of testDocs) {
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
    });
    it('succeeds', runSuiteAndWriteResults.bind(undefined, longSuite));
  });

  describe('Double', function () {
    const suite = new Suite('Double');
    before(async function () {
      const testDocs = await getTestDocs('double');

      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
            for (const promoteValues of BOOL) {
              suite.task({
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
        }
      }
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });

  describe('Code', function () {
    const suite = new Suite('Code');
    before(async function () {
      const testDocs = (await getTestDocs('code-without-scope')).concat(
        await getTestDocs('code-with-scope')
      );

      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
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
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });

  describe('Decimal128', function () {
    const suite = new Suite('Decimal128');

    before(async function () {
      const testDocs = await getTestDocs('decimal128');
      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
            suite.task({
              documentPath,
              library,
              iterations: ITERATIONS,
              warmup: WARMUP,
              operation,
              options: OPTIONS['decimal128'][operation]
            });
          }
        }
      }
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });

  describe('MinKey', function () {
    const suite = new Suite('MinKey');
    before(async function () {
      const testDocs = await getTestDocs('minkey');

      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
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
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });

  describe('MaxKey', function () {
    const suite = new Suite('MaxKey');
    before(async function () {
      const testDocs = await getTestDocs('maxkey');

      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
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
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });

  describe('Null', function () {
    const suite = new Suite('Null');
    before(async function () {
      const testDocs = await getTestDocs('null');

      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
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
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });

  describe('ObjectId', function () {
    const suite = new Suite('ObjectId');
    before(async function () {
      const testDocs = await getTestDocs('objectid');

      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
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
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });

  describe('Timestamp', function () {
    const suite = new Suite('Timestamp');
    before(async function () {
      const testDocs = await getTestDocs('timestamp');

      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
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
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });

  describe('Date', function () {
    const suite = new Suite('Date');
    before(async function () {
      const testDocs = await getTestDocs('date');

      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
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
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });

  describe('RexExp', function () {
    const suite = new Suite('RexExp');
    before(async function () {
      const testDocs = await getTestDocs('regex');

      for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
        for (const operation of OPERATIONS) {
          for (const documentPath of testDocs) {
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
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });

  describe('Mixed Document', function () {
    const mixedDocuments: string[] = [
      'tweet.json',
      'bestbuy.json',
      'deep_bson.json',
      'flat_bson.json',
      'full_bson.json'
    ].map(d => path.join(DOCUMENT_ROOT, d));
    const suite = new Suite('Mixed Documents');

    before(async function () {
      for (const library of BSON_VERSIONS.concat('BSONEXT_VERSIONS')) {
        for (const operation of OPERATIONS) {
          for (const documentPath of mixedDocuments) {
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
    });

    it('runs', runSuiteAndWriteResults.bind(undefined, suite));
  });
});
