import { Suite } from 'bson-bench';
import {
  runSuiteAndWriteResults,
  DOCUMENT_ROOT,
  OPERATIONS,
  ITERATIONS,
  WARMUP,
  getTestDocs,
  LIBRARY_SPEC
} from './common';
import * as path from 'path';

async function main() {
  const mixedDocuments: string[] = [
    'tweet.json',
    'bestbuy_medium.json',
    'deep_bson.json',
    'flat_bson.json',
    'full_bson.json',
    'mixed_large.json'
  ]
    .map(d => path.join(DOCUMENT_ROOT, d))
    .concat(await getTestDocs('mixed'))
    .concat(await getTestDocs('nested'));

  const suite = new Suite('Mixed Documents');

  for (const operation of OPERATIONS) {
    for (const documentPath of mixedDocuments) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation,
        options: {}
      });
    }
  }
  await runSuiteAndWriteResults(suite);
}
main();
