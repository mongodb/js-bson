import { Suite } from 'dbx-js-tools/packages/bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  LIBRARY_SPEC,
  ITERATIONS,
  WARMUP,
  BOOL
} from './common';

async function main() {
  const suite = new Suite('Regex');

  const testDocs = await getTestDocs('regex');

  for (const documentPath of testDocs) {
    // deserialize
    for (const bsonRegExp of BOOL) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'deserialize',
        options: { bsonRegExp }
      });
    }

    // serialize
    suite.task({
      documentPath,
      library: LIBRARY_SPEC,
      iterations: ITERATIONS,
      warmup: WARMUP,
      operation: 'serialize',
      options: {}
    });
  }
  await runSuiteAndWriteResults(suite);
}
main();
