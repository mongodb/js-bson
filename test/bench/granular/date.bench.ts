import { Suite } from 'dbx-js-tools/packages/bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  OPERATIONS,
  ITERATIONS,
  LIBRARY_SPEC,
  WARMUP
} from './common';

const OPTIONS = {
  serialize: { checkKeys: true, ignoreUndefined: false },
  deserialize: {}
};

async function main() {
  const suite = new Suite('Date');
  const testDocs = await getTestDocs('date');

  for (const operation of OPERATIONS) {
    for (const documentPath of testDocs) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation,
        options: OPTIONS[operation]
      });
    }
  }
  await runSuiteAndWriteResults(suite);
}
main();
