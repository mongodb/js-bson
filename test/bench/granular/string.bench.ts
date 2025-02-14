import { Suite } from 'dbx-js-tools/packages/bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  LIBRARY_SPEC,
  ITERATIONS,
  WARMUP,
  BOOL,
  getTypeTestTags
} from './common';

async function main() {
  const suite = new Suite('String');

  const testDocs = await getTestDocs('string');

  // deserialize
  for (const documentPath of testDocs) {
    const tags = getTypeTestTags(documentPath);
    for (const utf8 of BOOL) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'deserialize',
        options: { validation: { utf8 } },
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
      operation: 'serialize',
      options: { checkKeys: true, ignoreUndefined: false },
      tags
    });
  }
  await runSuiteAndWriteResults(suite);
}
main();
