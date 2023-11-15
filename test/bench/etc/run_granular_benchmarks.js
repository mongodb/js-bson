'use strict';

/**
 * This script runs all benchmarks in test/bench/lib/granular and merges their output
 */

const cp = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { once } = require('events');
const { Task } = require('dbx-js-tools/packages/bson-bench');

const BENCHMARK_REGEX = /(.*)\.bench\.js$/;
const BENCHMARK_PATH = path.resolve(`${__dirname}/../lib/granular`);
const DOCUMENT_ROOT = path.resolve(`${__dirname}/../documents`);
(async () => {
  // HACK : run one dummy task with the local bson to ensure it's available for subsequent suites
  await new Task({
    documentPath: path.resolve(`${DOCUMENT_ROOT}/binary_small.json`),
    library: `bson#main`,
    iterations: 1,
    warmup: 1,
    operation: 'deserialize',
    options: {}
  })
    .run()
    .catch(() => null);

  // Run all benchmark files
  const lib = await fs.readdir(BENCHMARK_PATH);
  for await (const dirent of lib) {
    if (BENCHMARK_REGEX.test(dirent)) {
      const child = cp.fork(`${BENCHMARK_PATH}/${dirent}`, { stdio: 'inherit' });

      const [exitCode] = await once(child, 'exit');
      if (exitCode !== 0) throw new Error('Failed to run benchmark');
    }
  }
  const resultPaths = [];

  for await (const dirent of await fs.opendir(__dirname)) {
    if (/Results.json$/.test(dirent.name)) {
      resultPaths.push(`${__dirname}/${dirent.name}`);
    }
  }

  if (resultPaths.length === 0) throw new Error('Benchmarks did not run successfully');

  // Ensure that there are no duplicate test-name/options pairs as this will prevent us from
  // uploading with perf.send
  const set = new Set();
  for (const resultFile of resultPaths) {
    const results = require(resultFile);
    for (const entry of results) {
      const name = entry.info.test_name;
      const args = JSON.stringify(entry.info.args);
      const key = `${name}:${args}`;

      if (set.has(key)) throw new Error(`Found a duplicate testName:Option pair: ${key}`);
      set.add(key);
    }
  }

  console.log('No duplcate testName:Option pairs found. Now merging files...');

  const resultFile = `${__dirname}/resultsCollected.json`;
  // Iterate over all result files and merge into one file
  const collectedResults = [];
  for (const resultPath of resultPaths) {
    const results = require(resultPath);
    if (Array.isArray(results)) {
      collectedResults.push(results);
    }
  }

  await fs.writeFile(resultFile, JSON.stringify(collectedResults));

  console.log(`Collected results in ${resultFile}`);
})();
