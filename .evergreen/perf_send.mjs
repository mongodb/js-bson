#! node
'use strict';

import * as fs from 'fs/promises';
import { inspect } from 'util';
console.log(process.versions);
const API_PATH = 'https://performance-monitoring-api.corp.mongodb.com/raw_perf_results';

const resultFile = process.argv[2];
if (resultFile == undefined) {
  throw new Error('Must specify result file');
}

// Get expansions
const {
  execution,
  requester,
  project,
  task_id,
  task_name,
  revision_order_id,
  build_variant: variant,
  version_id: version
} = process.env;

const orderSplit = revision_order_id?.split('_');
let order = orderSplit ? orderSplit[orderSplit.length - 1] : undefined;

if (!order) throw new Error(`failed to get order, got "${order}"`);

order = Number(order);

if (!Number.isInteger(order)) throw new Error(`Failed to parse integer from order, got ${order}`);

let results = await fs.readFile(resultFile, 'utf8');
results = JSON.parse(results);

// FIXME(NODE-6838): We are using dummy dates here just to be able to successfully post our results
for (const r of results) {
  r.info.created_at = new Date().toISOString();
  r.info.completed_at = new Date().toISOString();
}

const body = {
  id: {
    project,
    version,
    variant,
    order,
    task_name,
    task_id,
    execution,
    mainline: requester === 'commit'
  },
  results
};

console.log(inspect(body, { depth: Infinity }));

const resp = await fetch(API_PATH, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json'
  },
  body: JSON.stringify(body)
});

console.log(await resp.text());

let jsonResponse;
try {
  jsonResponse = await resp.json();
} catch (e) {
  throw new Error('Failed to parse json response', { cause: e });
}

console.log(inspect(jsonResponse, { depth: Infinity }));

if (!jsonResponse.message) throw new Error("Didn't get success message");

console.log('Successfully posted results');
