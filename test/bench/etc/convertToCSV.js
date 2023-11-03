#!/bin/env node
'use strict';
/** @type {Buffer[]}*/
const chunks = [];
let totalSize = 0;

process.stdin.on('data', chunk => {
  chunks.push(chunk);
  totalSize += chunk.byteLength;
});

process.stdin.on('end', () => {
  const buffer = Buffer.alloc(totalSize);

  for (let offset = 0, i = 0; offset < totalSize; offset += chunks[i++].byteLength) {
    buffer.set(chunks[i], offset);
  }

  const argColumns = new Set();
  const document = JSON.parse(buffer.toString('utf8'));

  for (const res of document) {
    const { args } = res.info;
    for (const key in args) {
      argColumns.add(key);
    }
  }
  const columns = ['test_name', 'max', 'mean', 'median', 'min', 'stddev'].concat(
    Array.from(argColumns)
  );

  process.stdout.write(columns.join(',') + '\n');

  for (const res of document) {
    const line = Array.from({ length: columns.length }, () => '-');
    const { test_name, args } = res.info;
    line[0] = test_name;
    for (const metric of res.metrics) {
      const { type, value } = metric;
      switch (type) {
        case 'MEAN':
          line[2] = String(value);
          break;
        case 'MEDIAN':
          line[3] = String(value);
          break;
        case 'MAX':
          line[1] = String(value);
          break;
        case 'MIN':
          line[4] = String(value);
          break;
        case 'STANDARD_DEVIATION':
          line[5] = String(value);
      }
    }

    for (const key in args) {
      const index = columns.indexOf(key);
      if (index !== -1) {
        line[index] = String(args[key]);
      }
    }

    process.stdout.write(line.join(','));
    process.stdout.write('\n');
  }
});
