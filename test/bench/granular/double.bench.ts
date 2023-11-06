import { Suite } from 'bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  LIBRARY_SPEC,
  OPERATIONS,
  BOOL,
  ITERATIONS,
  WARMUP
} from './common';

const OPTIONS = {
  serialize: { checkKeys: true, ignoreUndefined: false },
  deserialize: {
    promoteValues: true
  }
};

async function main() {
  const suite = new Suite('Double');
  const testDocs = await getTestDocs('double');

  for (const operation of OPERATIONS) {
    for (const documentPath of testDocs) {
      for (const promoteValues of BOOL) {
        suite.task({
          documentPath,
          library: LIBRARY_SPEC,
          iterations: ITERATIONS,
          warmup: WARMUP,
          operation,
          options:
            operation === 'deserialize'
              ? { ...OPTIONS[operation], promoteValues }
              : OPTIONS[operation]
        });
      }
    }
  }
  await runSuiteAndWriteResults(suite);
}
main();
