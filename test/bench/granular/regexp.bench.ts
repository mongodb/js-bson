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
  const suite = new Suite('Regex');

  const testDocs = await getTestDocs('regex');

  for (const documentPath of testDocs) {
    const tags = getTypeTestTags(documentPath);
    // deserialize
    for (const bsonRegExp of BOOL) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'deserialize',
        options: { bsonRegExp },
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
      options: {},
      tags
    });
  }
  await runSuiteAndWriteResults(suite);
}
main();
