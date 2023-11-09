import { Suite } from 'dbx-js-tools/packages/bson-bench';
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
  // deserialize
  for (const documentPath of testDocs) {
    for (const promoteBuffers of BOOL) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'deserialize',
        options: {
          promoteBuffers
        }
      });
    }

    // serialize
    suite.task({
      documentPath,
      library: LIBRARY_SPEC,
      iterations: ITERATIONS,
      warmup: WARMUP,
      operation: 'serialize',
      options: { checkKeys: true, ignoreUndefined: false }
    });
  }
  await runSuiteAndWriteResults(suite);
}

main();
