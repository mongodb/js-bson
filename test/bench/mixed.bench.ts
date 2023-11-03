import { Suite } from 'bson-bench';
import {
  runSuiteAndWriteResults,
  DOCUMENT_ROOT,
  BSON_VERSIONS,
  BSONEXT_VERSIONS,
  OPERATIONS,
  ITERATIONS,
  WARMUP
} from './common';
import * as path from 'path';

async function main() {
  const mixedDocuments: string[] = [
    'tweet.json',
    'bestbuy.json',
    'deep_bson.json',
    'flat_bson.json',
    'full_bson.json'
  ].map(d => path.join(DOCUMENT_ROOT, d));
  console.log(mixedDocuments);
  const suite = new Suite('Mixed Documents');

  for (const library of BSON_VERSIONS.concat(BSONEXT_VERSIONS)) {
    for (const operation of OPERATIONS) {
      for (const documentPath of mixedDocuments) {
        suite.task({
          documentPath,
          library,
          iterations: ITERATIONS,
          warmup: WARMUP,
          operation,
          options: {}
        });
      }
    }
  }
  await runSuiteAndWriteResults(suite);
}
main();
