import { Suite } from 'dbx-js-tools/packages/bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  LIBRARY_SPEC,
  BOOL,
  ITERATIONS,
  WARMUP,
  getTypeTestTags
} from './common';

const OPTIONS = {
  serialize: { checkKeys: true, ignoreUndefined: false },
  deserialize: {
    promoteValues: true,
    index: 0,
    evalFunctions: false,
    cacheFunctions: false,
    allowObjectSmallerThanBufferSize: false
  }
};

async function main() {
  const suite = new Suite('Int32');
  const testDocs = await getTestDocs('int32');
  for (const documentPath of testDocs) {
    const tags = getTypeTestTags(documentPath);
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
    //serialize
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
