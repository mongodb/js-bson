import { Suite } from 'dbx-js-tools/packages/bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  BOOL,
  ITERATIONS,
  WARMUP,
  LIBRARY_SPEC,
  getTypeTestTags
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
    const tags = getTypeTestTags(documentPath);
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
  }

  // serialize
  for (const documentPath of testDocs) {
    const tags = getTypeTestTags(documentPath);
    suite.task({
      documentPath,
      library: LIBRARY_SPEC,
      iterations: ITERATIONS,
      warmup: WARMUP,
      operation: 'deserialize',
      options: OPTIONS.serialize,
        tags
    });
  }
  await runSuiteAndWriteResults(suite);
}
main();
