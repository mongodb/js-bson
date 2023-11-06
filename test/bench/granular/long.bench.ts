import { Suite } from 'bson-bench';
import { getTestDocs, runSuiteAndWriteResults, ITERATIONS, LIBRARY_SPEC, WARMUP } from './common';

const JSBSONDeserializationOptions = [
  {
    useBigInt64: false,
    promoteValues: false,
    promoteLongs: false
  },
  {
    useBigInt64: false,
    promoteValues: true,
    promoteLongs: true
  },
  {
    useBigInt64: true
  }
];
const JSBSONSerializationOptions = [{}];

async function main() {
  const suite = new Suite('Long');

  const testDocs = await getTestDocs('long');
  // LONG JS-BSON Deserialization tests
  for (const documentPath of testDocs) {
    for (const options of JSBSONDeserializationOptions) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'deserialize',
        options
      });
    }
  }

  // LONG JS-BSON Serialization tests
  for (const documentPath of testDocs) {
    for (const options of JSBSONSerializationOptions) {
      suite.task({
        documentPath,
        library: LIBRARY_SPEC,
        iterations: ITERATIONS,
        warmup: WARMUP,
        operation: 'serialize',
        options
      });
    }
  }

  await runSuiteAndWriteResults(suite);
}
main();
