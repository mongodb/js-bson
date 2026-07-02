import { Suite } from 'dbx-js-tools/packages/bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  BOOL,
  ITERATIONS,
  LIBRARY_SPEC,
  WARMUP,
  getTypeTestTags
} from './common';

async function main() {
  const suite = new Suite('Binary');
  const testDocs = [
    ...(await getTestDocs('binary_vector_float32')),
    ...(await getTestDocs('binary_vector_int8')),
    ...(await getTestDocs('binary_vector_packedbit')),
    ...(await getTestDocs('binary'))
  ];
  // deserialize
  for (const documentPath of testDocs) {
    const tags = getTypeTestTags(documentPath);
    for (const promoteBuffers of BOOL) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'deserialize',
        options: {
          promoteBuffers
        },
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
      options: { checkKeys: true, ignoreUndefined: false },
      tags
    });
  }
  await runSuiteAndWriteResults(suite);
}

main();
