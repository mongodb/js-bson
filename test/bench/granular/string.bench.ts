import { Suite } from 'dbx-js-tools/packages/bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  LIBRARY_SPEC,
  ITERATIONS,
  WARMUP,
  BOOL
} from './common';

async function main() {
  const suite = new Suite('String');

  const testDocs = await getTestDocs('string');

  // deserialize
  for (const documentPath of testDocs) {
    for (const utf8 of BOOL) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'deserialize',
        options: { validation: { utf8 } }
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
      operation: 'serialize',
      options: { checkKeys: true, ignoreUndefined: false }
    });
  }
  await runSuiteAndWriteResults(suite);
}
main();
