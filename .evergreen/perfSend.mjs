#! node
'use strict';

import * as fs from 'fs/promises';
console.log(process.versions);
// STAGING
const API_PATH = "https://performance-monitoring-service-rest.server-tig.staging.corp.mongodb.com/raw_perf_results"

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


fs.readFile(resultFile, { encoding: 'utf8' })
  .then(
    results => {
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
      return fetch(API_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      })
    }
  )
  .then(resp => {
    console.log(resp);
    if (resp.status !== 200) {
      throw new Error('Got non 200 status code')
    }
  });
