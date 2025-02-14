import { Suite } from 'dbx-js-tools/packages/bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  LIBRARY_SPEC,
  BOOL,
  ITERATIONS,
  WARMUP,
  getTags
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

  for (const documentPath of testDocs) {
    const tags = getTags(documentPath);
    // deserialize
    for (const promoteValues of BOOL) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'deserialize',
        options: { ...OPTIONS.deserialize, promoteValues },
        tags
      });
    }

    // serialize
    suite.task({
      documentPath,
      library: LIBRARY_SPEC,
      iterations: ITERATIONS,
      warmup: WARMUP,
      operation: 'serialize',
      options: OPTIONS.serialize,
      tags
    });
  }
  await runSuiteAndWriteResults(suite);
}
main();
