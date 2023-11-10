import { Suite } from 'dbx-js-tools/packages/bson-bench';
import { join, resolve } from 'path';
import { writeFile } from 'fs/promises';

const suite = new Suite('bson micro benchmarks');
const libraryPath = resolve(`${__dirname}/../../../..`);
const LIBRARY = `bson:${libraryPath}`;
const DOCUMENT_ROOT = resolve(`${__dirname}/../../documents`);
// Add flat bson encoding
suite.task({
  documentPath: join(DOCUMENT_ROOT, 'flat_bson.json'),
  library: LIBRARY,
  warmup: 1000,
  iterations: 10_000,
  operation: 'serialize',
  options: {}
});

// Add flat bson decoding
suite.task({
  documentPath: join(DOCUMENT_ROOT, 'flat_bson.json'),
  library: LIBRARY,
  warmup: 1000,
  iterations: 10_000,
  operation: 'deserialize',
  options: {}
});

// Add deep bson encoding
suite.task({
  documentPath: join(DOCUMENT_ROOT, 'deep_bson.json'),
  library: LIBRARY,
  warmup: 1000,
  iterations: 10_000,
  operation: 'serialize',
  options: {}
});

// Add deep bson decoding
suite.task({
  documentPath: join(DOCUMENT_ROOT, 'deep_bson.json'),
  library: LIBRARY,
  warmup: 1000,
  iterations: 10_000,
  operation: 'deserialize',
  options: {}
});

// Add full bson encoding
suite.task({
  documentPath: join(DOCUMENT_ROOT, 'full_bson.json'),
  library: LIBRARY,
  warmup: 1000,
  iterations: 10_000,
  operation: 'serialize',
  options: {}
});

// Add full bson decoding
suite.task({
  documentPath: join(DOCUMENT_ROOT, 'full_bson.json'),
  library: LIBRARY,
  warmup: 1000,
  iterations: 10_000,
  operation: 'deserialize',
  options: {}
});

suite.run().then(
  () => {
    const results = suite.results;
    // calculte BSONBench composite score
    const bsonBenchComposite =
      results.reduce((prev, result) => {
        // find MEAN
        let resultMean: number | undefined = undefined;
        for (const metric of result.metrics) {
          if (metric.type === 'MEAN') {
            resultMean = metric.value;
          }
        }

        if (!resultMean) throw new Error('Failed to calculate results');

        return prev + resultMean;
      }, 0) / results.length;

    // Add to results
    results.push({
      info: {
        test_name: 'BSONBench',
        tags: [],
        args: {}
      },
      metrics: [
        {
          name: 'BSONBench composite score',
          type: 'THROUGHPUT',
          value: bsonBenchComposite
        }
      ]
    });

    // Write results to file
    return writeFile('bsonBench.json', JSON.stringify(results));
  },
  error => {
    console.error(error);
  }
);
