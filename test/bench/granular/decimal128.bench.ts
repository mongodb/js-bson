import { Suite } from 'dbx-js-tools/packages/bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  OPERATIONS,
  ITERATIONS,
  LIBRARY_SPEC,
  WARMUP,
  getTags
} from './common';

const OPTIONS = {
  serialize: { checkKeys: true, ignoreUndefined: false },
  deserialize: {
    index: 0,
    evalFunctions: false,
    cacheFunctions: false,
    allowObjectSmallerThanBufferSize: false
  }
};

async function main() {
  const suite = new Suite('Decimal128');
  const testDocs = await getTestDocs('decimal128');
  for (const documentPath of testDocs) {
    const tags = getTags(documentPath);
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
