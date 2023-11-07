'use strict';

const cp = require('child_process');
const fs = require('fs/promises');

const BENCHMARK_REGEX = /(.*)\.bench\.js$/;
(async () => {
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
    console.log(dirent.name);
    if (/Results.json$/.test(dirent.name)) {
      resultPaths.push(`./${dirent.name}`);
    }
  }

  // Merge results into one file
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
})();
