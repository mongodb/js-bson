import { Suite } from 'dbx-js-tools/packages/bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
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
  // deserialize
  for (const documentPath of testDocs) {
    for (const promoteValues of BOOL) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'deserialize',
        options: { ...OPTIONS.deserialize, promoteValues }
      });
    }
  }

  // serialize
  for (const documentPath of testDocs) {
    suite.task({
      documentPath,
      library: LIBRARY_SPEC,
      iterations: ITERATIONS,
      warmup: WARMUP,
      operation: 'deserialize',
      options: OPTIONS.serialize
    });
  }
  await runSuiteAndWriteResults(suite);
}
main();
