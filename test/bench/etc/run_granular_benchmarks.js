'use strict';

const cp = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { Task } = require('dbx-js-tools/packages/bson-bench');

const BENCHMARK_REGEX = /(.*)\.bench\.js$/;
(async () => {
  // HACK : run one dummy task with the local bson to ensure it's available for subsequent suites
  await new Task({
    documentPath: path.resolve(`${__dirname}/../documents/binary_small.json`),
    library: `bson:${path.resolve(`${__dirname}/../../../.`)}`,
    iterations: 1,
    warmup: 1,
    operation: 'deserialize',
    options: {}
  })
    .run()
    .catch(() => null);

  // Run all benchmark files
  const lib = await fs.readdir('../lib/granular');
  for await (const dirent of lib) {
    if (BENCHMARK_REGEX.test(dirent)) {
      const child = cp.fork(`../lib/granular/${dirent}`);
      if (child.stdout) child.stdout.pipe(process.stdout);
      if (child.stderr) child.stdout.pipe(process.stderr);

      await new Promise((resolve, reject) =>
        child.once('exit', code => {
          if (code !== 0) return reject();
          return resolve();
        })
      );
    }
  }
  const resultPaths = [];

  for await (const dirent of await fs.opendir('./')) {
    if (/Results.json$/.test(dirent.name)) {
      resultPaths.push(`./${dirent.name}`);
    }
  }

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

  // Iterate over all result files and merge into one file
  const collectedResults = await fs.open('resultsCollected.json', 'w+');
  await collectedResults.write('[\n');
  for (let i = 0; i < resultPaths.length; i++) {
    const resultPath = resultPaths[i];
    const results = require(resultPath);
    if (Array.isArray(results)) {
      for (let j = 0; j < results.length; j++) {
        collectedResults.write(
          `  ${JSON.stringify(results[j], undefined, 2)}${
            j === results.length - 1 && i === resultPaths.length - 1 ? '' : ',\n'
          }`
        );
      }
    }
  }

  await collectedResults.write(']\n');
  await collectedResults.close();

  console.log(`Collected results in ${__dirname}/resultsCollected.json`);
})();