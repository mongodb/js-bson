import { PerfSendResult, Suite } from 'dbx-js-tools/packages/bson-bench';
import { join, resolve } from 'path';
import { writeFile, readFile } from 'fs/promises';
import { readEnvVars, ALERT_TAG } from '../granular/common';

type Metadata = {
  improvement_direction: 'up' | 'down';
};
const suite = new Suite('bson micro benchmarks');
const DOCUMENT_ROOT = resolve(`${__dirname}/../../documents`);
const { library } = readEnvVars();
const warmup = 1000;
const iterations = 10_000;
// Add flat bson encoding
suite.task({
  documentPath: join(DOCUMENT_ROOT, 'flat_bson.json'),
  library,
  warmup,
  iterations,
  operation: 'serialize',
  options: {},
  tags: [ALERT_TAG]
});

// Add flat bson decoding
suite.task({
  documentPath: join(DOCUMENT_ROOT, 'flat_bson.json'),
  library,
  warmup,
  iterations,
  operation: 'deserialize',
  options: {},
  tags: [ALERT_TAG]
});

// Add deep bson encoding
suite.task({
  documentPath: join(DOCUMENT_ROOT, 'deep_bson.json'),
  library,
  warmup,
  iterations,
  operation: 'serialize',
  options: {},
  tags: [ALERT_TAG]
});

// Add deep bson decoding
suite.task({
  documentPath: join(DOCUMENT_ROOT, 'deep_bson.json'),
  library,
  warmup,
  iterations,
  operation: 'deserialize',
  options: {},
  tags: [ALERT_TAG]
});

// Add full bson encoding
suite.task({
  documentPath: join(DOCUMENT_ROOT, 'full_bson.json'),
  library,
  warmup,
  iterations,
  operation: 'serialize',
  options: {},
  tags: [ALERT_TAG]
});

// Add full bson decoding
suite.task({
  documentPath: join(DOCUMENT_ROOT, 'full_bson.json'),
  library,
  warmup,
  iterations,
  operation: 'deserialize',
  options: {},
  tags: [ALERT_TAG]
});

suite
  .run()
  .then(() => {
    return readFile(join(__dirname, '..', '..', 'etc', 'cpuBaseline.json'), 'utf8');
  }, console.error)
  .then(cpuBaseline => {
    if (!cpuBaseline) throw new Error('could not find cpu baseline');

    const cpuBaselineResult = JSON.parse(cpuBaseline).megabytes_per_second;
    if (typeof cpuBaselineResult !== 'number')
      throw new Error('Could not find correctly formatted baseline results');

    const suiteResults = suite.results as {
      info: PerfSendResult['info'];
      metrics: (PerfSendResult['metrics'][0] & { metadata?: Metadata })[];
    }[];
    const results = suiteResults.map(result => {
      const rv = { ...result };
      rv.metrics = rv.metrics.filter(metric => metric.type === 'MEAN');
      return rv;
    });

    const metadata: Metadata = { improvement_direction: 'up' };
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

    for (const r of results) {
      r.metrics[0].metadata = metadata;
      r.metrics.push({
        name: 'normalized_throughput',
        value: r.metrics[0].value / cpuBaselineResult,
        metadata
      });
    }

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
          value: bsonBenchComposite,
          metadata
        }
      ]
    });

    results.push({
      info: {
        test_name: 'cpuBaseline',
        tags: [],
        args: {}
      },
      metrics: [{ name: 'mean_megabytes_per_second', value: cpuBaselineResult, metadata }]
    });

    // Write results to file
    return writeFile('bsonBench.json', JSON.stringify(results));
  }, console.error);
