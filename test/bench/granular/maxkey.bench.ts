import { Suite } from 'dbx-js-tools/packages/bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  LIBRARY_SPEC,
  OPERATIONS,
  ITERATIONS,
  WARMUP,
  getTypeTestTags
} from './common';

const OPTIONS = {
  serialize: { checkKeys: true, ignoreUndefined: false },
  deserialize: {
    index: 0
  }
};

async function main() {
  const suite = new Suite('MaxKey');
  const testDocs = await getTestDocs('maxkey');

  for (const documentPath of testDocs) {
    const tags = getTypeTestTags(documentPath);
    for (const operation of OPERATIONS) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation,
        options: OPTIONS[operation],
        tags
      });
    }
  }
  await runSuiteAndWriteResults(suite);
}
main();
