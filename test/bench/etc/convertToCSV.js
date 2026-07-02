#!/bin/env node
'use strict';

/**
 * This script reads data in perf.send format from stdin and converts it to csv, writing output to
 * stdout
 */

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
  const columns = ['test_name', 'library', 'max', 'mean', 'median', 'min', 'stddev'].concat(
    Array.from(argColumns)
  );

  process.stdout.write(columns.join(',') + '\n');

  for (const res of document) {
    const line = Array.from({ length: columns.length }, () => '-');
    const { test_name, args } = res.info;
    const parts = test_name.split('_');
    const library = parts[parts.length - 1];
    const name = parts.slice(0, parts.length - 1).join('_');
    // last part is library
    // previous parts joined are test name
    line[0] = name;
    line[1] = library;
    for (const metric of res.metrics) {
      const { type, value } = metric;
      switch (type) {
        case 'MEAN':
          line[3] = String(value);
          break;
        case 'MEDIAN':
          line[4] = String(value);
          break;
        case 'MAX':
          line[2] = String(value);
          break;
        case 'MIN':
          line[5] = String(value);
          break;
        case 'STANDARD_DEVIATION':
          line[6] = String(value);
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
