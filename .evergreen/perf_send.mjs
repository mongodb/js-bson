#! node
'use strict';

import * as fs from 'fs/promises';
import { inspect } from 'util';
console.log(process.versions);
const API_PATH = "https://performance-monitoring-service-rest.server-tig.prod.corp.mongodb.com/raw_perf_results"

const resultFile = process.argv[2];
if (resultFile == undefined) {
  throw new Error("Must specify result file");
}

// Get expansions
const {
  execution,
  requester,
  project,
  task_id,
  task_name,
  revision_order_id: order,
  build_variant: variant,
  version_id: version
} = process.env;


const results = await fs.readFile(resultFile, 'utf8');
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
  results: JSON.parse(results)
};

console.log(inspect(body, { depth: Infinity }));

const resp = await fetch(API_PATH, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

if (resp.status !== 200) {
  throw new Error(`Got status code: ${resp.status}\nResponse body: ${await resp.text()}`);
}

console.log("Successfully posted results");
