import { Suite } from 'bson-bench';
import {
  getTestDocs,
  runSuiteAndWriteResults,
  BSON_VERSIONS,
  BSONEXT_VERSIONS,
  ITERATIONS,
  WARMUP
} from './common';

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

const BSONEXTDeserializationOptions = [
  {
    promoteValues: false,
    promoteLongs: false
  },
  {
    promoteValues: true,
    promoteLongs: true
  }
];
const BSONEXTSerializationOptions = [{}];

async function main() {
  const suite = new Suite('Long');

  const testDocs = await getTestDocs('long');
  // LONG JS-BSON Deserialization tests
  for (const library of BSON_VERSIONS) {
    for (const documentPath of testDocs) {
      for (const options of JSBSONDeserializationOptions) {
        suite.task({
          documentPath,
          library,
          iterations: ITERATIONS,
          warmup: WARMUP,
          operation: 'deserialize',
          options
        });
      }
    }
  }

  // LONG JS-BSON Serialization tests
  for (const library of BSON_VERSIONS) {
    for (const documentPath of testDocs) {
      for (const options of JSBSONSerializationOptions) {
        suite.task({
          documentPath,
          library,
          iterations: ITERATIONS,
          warmup: WARMUP,
          operation: 'serialize',
          options
        });
      }
    }
  }

  // LONG BSON-EXT Deserialization tests
  for (const library of BSONEXT_VERSIONS) {
    for (const documentPath of testDocs) {
      for (const options of BSONEXTDeserializationOptions) {
        suite.task({
          documentPath,
          library,
          iterations: ITERATIONS,
          warmup: WARMUP,
          operation: 'deserialize',
          options
        });
      }
    }
  }

  // LONG BSON-EXT Serialization tests
  for (const library of BSONEXT_VERSIONS) {
    for (const documentPath of testDocs) {
      for (const options of BSONEXTSerializationOptions) {
        suite.task({
          documentPath,
          library,
          iterations: ITERATIONS,
          warmup: WARMUP,
          operation: 'serialize',
          options
        });
      }
    }
  }
  await runSuiteAndWriteResults(suite);
}
main();
