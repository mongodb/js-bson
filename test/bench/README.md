# BSON benchmarking

This directory contains the files pertinent to performance testing of js-bson.

The `documents` directory contains generated documents used for performance testing

The `etc` directory contains scripts used to run benchmarks, generate benchmark documents and
process the results.

The `granular` directory contains files that test bson performance in a range of different
scenarios using the bson-bench library.

The `spec` directory contains one file used to run the performance tests mandated by the bson
microbenchmarking specification.


Granular tests can be run from the repository root by running:

```
WARMUP=<warmup iterations> ITERATIONS=<measured iterations> npm run check:granular-bench
```

This will build the granular tests and run them with `test/bench/etc/run_granular_benchmarks.js`. The `WARMUP` and `ITERATIONS` environment variables can be optionally provided to configure how these granular benchmarks
are run. `WARMUP` changes the number of iterations run before results are collected to give v8's
optimizing compiler time to reach steady state. `ITERATIONS` changes the number of iterations that
are measured and use to calculate summary statistics.

When this script is complete, results will be output to `test/bench/etc/resultsCollected.json`. These results will
be in a format compatible with evergreen's perf.send command. To convert these results to CSV, run
the following command from the repository root:

```
./test/bench/etc/convertToCSV.js < test/bench/etc/resultsCollected.json > resultsCollected.csv
```

Spec tests can be run from the repository root by running:

```
npm run check:spec-bench
```

This will run the spec benchmarks in `test/bench/spec/bsonBench.ts` which also makes use of the
`bson-bench` library. Results will be written to `bsonBench`.
