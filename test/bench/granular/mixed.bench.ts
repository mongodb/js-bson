import { Suite } from 'dbx-js-tools/packages/bson-bench';
import {
  runSuiteAndWriteResults,
  DOCUMENT_ROOT,
  OPERATIONS,
  ITERATIONS,
  WARMUP,
  LIBRARY_SPEC
} from './common';
import * as path from 'path';

const OPTIONS = {
  serialize: { checkKeys: true, ignoreUndefined: false },
  deserialize: {
    promoteValues: true,
    index: 0
  }
};

async function main() {
  const mixedDocuments: string[] = [
    'tweet.json',
    'bestbuy_medium.json',
    'mixed_large.json',
    'mixed_medium.json',
    'mixed_small.json',
    'nested_4.json',
    'nested_8.json',
    'nested_16.json'
  ].map(d => path.join(DOCUMENT_ROOT, d));

  const suite = new Suite('Mixed Documents');

  // TODO:
  for (const operation of OPERATIONS) {
    for (const documentPath of mixedDocuments) {
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
