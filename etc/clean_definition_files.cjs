#! /usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

function* walk(root) {
  const directoryContents = fs.readdirSync(root);
  for (const filepath of directoryContents) {
    const fullPath = path.join(root, filepath);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      yield fullPath;
      yield* walk(fullPath);
    } else if (stat.isFile()) {
      yield fullPath;
    }
  }
}

const libPath = path.resolve(__dirname, '..', 'lib');
if (fs.existsSync(libPath)) {
  const definitionFiles = Array.from(walk(libPath))
    .filter(filePath => filePath.endsWith('.d.ts') || filePath.endsWith('.d.ts.map'));

  for (const definitionFile of definitionFiles) {
    fs.unlinkSync(definitionFile);
  }

  const emptyDirectories = Array.from(walk(libPath))
    .filter(filePath => fs.statSync(filePath).isDirectory() && fs.readdirSync(filePath).length === 0);

  for (const emptyDirectory of emptyDirectories) {
    fs.rmdirSync(emptyDirectory);
  }
}
