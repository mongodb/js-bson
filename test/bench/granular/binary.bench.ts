import { Suite } from 'bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  OPERATIONS,
  BOOL,
  ITERATIONS,
  LIBRARY_SPEC,
  WARMUP
} from './common';

async function main() {
  const suite = new Suite('Binary');
  const testDocs = await getTestDocs('binary');
  for (const operation of OPERATIONS) {
    for (const documentPath of testDocs) {
      for (const promoteBuffers of BOOL) {
        suite.task({
          documentPath,
          library: LIBRARY_SPEC,
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
  await runSuiteAndWriteResults(suite);
}

main();
