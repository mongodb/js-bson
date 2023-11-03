import { Suite } from 'bson-bench';
import {
  getTestDocs,
  isDeserialize,
  runSuiteAndWriteResults,
  BSON_VERSIONS,
  BSONEXT_VERSIONS,
  OPERATIONS,
  BOOL,
  ITERATIONS,
  WARMUP
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
  for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
    for (const operation of OPERATIONS) {
      for (const documentPath of testDocs) {
        for (const promoteValues of BOOL) {
          suite.task({
            documentPath,
            library,
            iterations: ITERATIONS,
            warmup: WARMUP,
            operation,
            options: isDeserialize(operation)
              ? { ...OPTIONS[operation], promoteValues }
              : OPTIONS[operation]
          });
        }
      }
    }
  }
  await runSuiteAndWriteResults(suite);
}
main();
