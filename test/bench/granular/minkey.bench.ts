import { Suite } from 'bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  LIBRARY_SPEC,
  OPERATIONS,
  ITERATIONS,
  WARMUP
} from './common';

async function main() {
  const suite = new Suite('MinKey');
  const testDocs = await getTestDocs('minkey');

  for (const operation of OPERATIONS) {
    for (const documentPath of testDocs) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation,
        options: {}
      });
    }
  }
  await runSuiteAndWriteResults(suite);
}
main();
