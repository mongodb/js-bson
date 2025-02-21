import { Suite } from 'dbx-js-tools/packages/bson-bench';
import * as path from 'path';
import * as fs from 'fs/promises';

export const DOCUMENT_ROOT = `${__dirname}/../../documents`;
export const OPERATIONS: ('serialize' | 'deserialize')[] = ['serialize', 'deserialize'];
export const BOOL = [true, false];

export const isDeserialize = (s: string) => s === 'deserialize';
export async function getTestDocs(type: string) {
  const docs = ['singleFieldDocument', 'singleElementArray'].map(testType =>
    path.join(DOCUMENT_ROOT, `${type}_${testType}.json`)
  );

  const dir = await fs.opendir(DOCUMENT_ROOT);
  const arrayRegex = new RegExp(`${type}_array_\\d+\\.json`);
  const sizedRegex = new RegExp(`${type}_(small|medium|large)\\.json`);
  for await (const entry of dir) {
    // Get array and sized docs
    if (arrayRegex.test(entry.name) || sizedRegex.test(entry.name)) {
      docs.push(path.join(DOCUMENT_ROOT, entry.name));
    }
  }

  return docs;
}

const ALERTING_DOCS = new Set([
  'objectid_array_1000.json',
  'double_array_1000.json',
  'int32_array_1000.json',
  'long_array_1000.json',
  'string_array_1000.json',
  'binary_array_1000.json',
  'bestbuy_medium.json'
]);

export const ALERT_TAG = 'alerting-benchmark';

export function getTypeTestTags(documentPath: string) {
  const basename = path.basename(documentPath).split('.')[0];
  const type = basename.split('_')[0];

  if (ALERTING_DOCS.has(basename)) {
    return [type, ALERT_TAG];
  } else {
    return [type];
  }
}

export function getMixedTestTags(documentPath: string) {
  const basename = path.basename(documentPath).split('.')[0];

  if (ALERTING_DOCS.has(basename)) {
    return ['mixed', ALERT_TAG];
  }

  return ['mixed'];
}

export async function runSuiteAndWriteResults(suite: Suite) {
  const targetDirectory = path.resolve(`${__dirname}/../../etc`);
  await suite.run();
  await suite.writeResults(`${targetDirectory}/${suite.name.toLowerCase()}Results.json`);
}

export function readEnvVars(): { warmup: number; iterations: number; library: string } {
  const envWarmup = Number(process.env.WARMUP);
  const envIterations = Number(process.env.ITERATIONS);
  const libraryPath = process.env.LIBRARY;
  const rv = {
    warmup: Number.isSafeInteger(envWarmup) && envWarmup > 0 ? envWarmup : 100_000,
    iterations: Number.isSafeInteger(envIterations) && envIterations > 0 ? envIterations : 10_000,
    library: libraryPath ? `bson:${libraryPath}` : 'bson#main'
  };

  console.log(
    `warmup iterations: ${rv.warmup}\nmeasured iterations: ${rv.iterations}\nlibrary: ${rv.library}`
  );

  return rv;
}

const envVars = readEnvVars();
export const ITERATIONS = envVars.iterations;
export const WARMUP = envVars.warmup;
export const LIBRARY_SPEC = envVars.library;
