import { Suite } from 'bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  BSON_VERSIONS,
  BSONEXT_VERSIONS,
  OPERATIONS,
  ITERATIONS,
  WARMUP
} from './common';

async function main() {
  const suite = new Suite('ObjectId');
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
  await runSuiteAndWriteResults(suite);
}
main();
