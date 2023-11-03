import { Suite } from 'bson-bench';
import {
  getTestDocs,
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
    promoteValues: true
  }
};

async function main() {
  const suite = new Suite('Double');
  const testDocs = await getTestDocs('double');

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
            options:
              operation === 'deserialize'
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
