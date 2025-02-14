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

async function main() {
  const suite = new Suite('ObjectId');
  const testDocs = await getTestDocs('objectid');

  for (const documentPath of testDocs) {
    const tags = getTypeTestTags(documentPath);
    for (const operation of OPERATIONS) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation,
        options: {},
        tags
      });
    }
  }
  await runSuiteAndWriteResults(suite);
}
main();
