'use strict';

const cp = require('child_process');
const fs = require('fs/promises');

const rx = /(.*)\.bench\.js$/;
(async () => {
  const lib = await fs.readdir('../lib/granular');
  for await (const dirent of lib) {
    if (rx.test(dirent)) {
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
})();
