import { Suite } from 'bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  OPERATIONS,
  BOOL,
  ITERATIONS,
  WARMUP,
  LIBRARY_SPEC
} from './common';

const OPTIONS = {
  serialize: { checkKeys: true, ignoreUndefined: false },
  deserialize: {
    promoteValues: true,
    index: 0
  }
};

async function main() {
  const suite = new Suite('Boolean');
  const testDocs = await getTestDocs('boolean');
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
