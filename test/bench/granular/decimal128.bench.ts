import { Suite } from 'bson-bench';
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
