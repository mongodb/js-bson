# Contributing

When contributing to this repository, please first discuss the change you wish
to make via issue, pull request, or any other method with the owners of this
repository before making a change.

Please follow the [code of conduct][code-of-conduct] in all your interactions with the project.

## Developer Startup Guide

This section will walk you through how to get started working with the code.
### Runtime

We recommend you install Node Version Manager for [UNIX systems][nvm-unix] or [Windows][nvm-windows].

All code changes must work on the minimum Node version specified in [package.json](./package.json) under the "engines" key.

### Get the Code

Begin by creating a fork of this repo and cloning the fork.  Then run `npm install` to install necessary dependencies.

### Visual Studio Code Setup

One option to get up and running quickly is to use a preconfigured VS Code [workspace][workspace-file].  Save the the workspace file in a directory separate from the directory where you cloned this repo.  Open the workspace file in VS Code, and update `folders.path` to point to your local `js-bson` directory and update the `runtimeExecutable` field of the launch configuration to be the path to your Node.js executable.

Alternatively, if you just want to get formatting and linting working automatically, add these settings to your VS Code code workspace:

```jsonc
"settings":{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[javascript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[typescript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint",
  }
}
```

We recommended these VS Code extensions:
  - [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [test-explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer)
  - [mocha-test-adapter](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter)
  - [coverage-gutters](https://marketplace.visualstudio.com/items?itemName=ryanluker.vscode-coverage-gutters)
  - [pull-request-github](https://marketplace.visualstudio.com/items?itemName=github.vscode-pull-request-github)
  - [mongodb](https://marketplace.visualstudio.com/items?itemName=mongodb.mongodb-vscode)
  - [gitlens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)


### Automated Tests

This repo contains a suite of automated tests that can be run with the following command:

```bash
npm run test
```

### BSON benchmarking

The `test/bench` directory contains the files pertinent to performance testing of js-bson.

The `test/bench/documents` directory contains generated documents used for performance testing

The `test/bench/etc` directory contains scripts used to run benchmarks, generate benchmark documents and
process the results.

The `test/bench/granular` directory contains files that test bson performance in a range of different
scenarios using the bson-bench library.

The `test/bench/spec` directory contains one file used to run the performance tests mandated by the bson
[microbenchmarking](https://github.com/mongodb/specifications/blob/master/source/benchmarking/benchmarking.md#bson-micro-benchmarks) specification.


Granular tests can be run from the repository root by running:

```bash
WARMUP=<warmup iterations> ITERATIONS=<measured iterations> npm run check:granular-bench
```

This will build the granular tests and run them with `test/bench/etc/run_granular_benchmarks.js`. The `WARMUP` and `ITERATIONS` environment variables can be optionally provided to configure how these granular benchmarks
are run. `WARMUP` changes the number of iterations run before results are collected to give v8's
optimizing compiler time to reach steady state. `ITERATIONS` changes the number of iterations that
are measured and used to calculate summary statistics. Note also that the test can be configured to
make use of the local copy of bson when testing performance changes locally by setting the `LIBRARY`
variable to the root directory of the bson library to be tested.

```bash
WARMUP=100 ITERATIONS=1000 LIBRARY=$(pwd) npm run check:granular-bench
```
When the `LIBRARY` environment variable is unset, the benchmark clones and runs against the main
branch of this repository.

When the script is complete, results will be output to `test/bench/etc/resultsCollectedMeans.json`. These results will
be in a format compatible with evergreen's perf.send command. To convert these results to CSV, run
the following command from the repository root:

```bash
./test/bench/etc/convertToCSV.js < test/bench/etc/resultsCollectedMeans.json > resultsCollected.csv
```

Spec tests can be run from the repository root by running:

``` bash
npm run check:spec-bench
```

This will run the spec benchmarks in `test/bench/spec/bsonBench.ts` which also makes use of the
`bson-bench` library. Results will be written to `bsonBench`. The warmup and iterations are not
configurable as these are determined by the common driver benchmarking specification, but similar
to the granular benchmarks, the spec benchmarks can be run against the local copy of bson by setting
the `LIBRARY` environment variable appropriately.

```bash
LIBRARY=$(pwd) npm run check:spec-bench
```

### Commit messages

Please follow the [Conventional Commits specification][conventional-commit-style].
The format should look something like the following (note the blank lines):

```txt
<type>(<scope>): <subject>

<body>
```

If there is a relevant [NODE Jira ticket][node-jira], reference the ticket number in the scope portion of the commit.

Note that a BREAKING CHANGE commit should include an exclamation mark after the scope, for example:

```text
feat(NODE-xxxx)!: created new version api, removed support for old version
```

This helps the team automate [HISTORY.md](HISTORY.md) generation.
These are the commit types we make use of:

- **feat:** A new feature or deprecating (not removing) an existing feature
- **fix:** A bug fix
- **docs:** Documentation only changes
- **style:** Changes that do not affect the meaning of the code (e.g, formatting)
- **refactor:** A code change that neither fixes a bug nor adds a feature
- **perf:** A code change that improves performance
- **test:** Adds missing or corrects existing test(s)
- **chore:** Changes to the build process or auxiliary tools and libraries such as documentation generation

## Conventions Guide

Below are some conventions that aren't enforced by any of our tooling but we nonetheless do our best to adhere to:

- **Disallow `export default` syntax**
  - For our use case, it is best if all imports / exports remain named.
- **As of 4.0 all code in src is in Typescript**
  - Typescript provides a nice developer experience.
    As a product of using TS, we should be using ES6 syntax features whenever possible.
- **Errors**
  - Error messages should be sentence case and have no periods at the end.

## Pull Request Process

1. Update the README.md or similar documentation with details of changes you
   wish to make, if applicable.
1. Add any appropriate tests.
1. Make your code or other changes.
1. Please adhere to the guidelines in [How to write the perfect pull request][github-perfect-pr], thanks!
1. Please perform a self-review using the reviewer guidelines below prior to taking the PR out of draft state.

### Reviewer Guidelines

Reviewers should use the following questions to evaluate the implementation for correctness/completeness and ensure all housekeeping items have been addressed prior to merging the code.

- Correctness/completeness
  1. Do you fully understand the implementation? (Would you be comfortable explaining how this code works to someone else?)
  1. Does the code meet the acceptance criteria?
     - If there is an associated spec, does the code match the spec?
  1. Is the intention of the code captured in relevant tests?
     - Does the description of each test accurately represent the assertions?
     - For any test explicitly called out on the ticket as desirable to implement, was it implemented?
     - If there are prose spec tests, were they implemented?
     - If there are associated automated spec tests, were they all pulled in and are they all running and correctly interpreting the spec inputs?
       - Are any runner changes needed to process new input types?
  1. Could these changes impact any adjacent functionality?
  1. Are there any errors that might not be correctly caught or propagated?
  1. Is there anything that could impact performance?
  1. Are there any race conditions in the functional code or tests?
  1. Can you think of a better way to implement any of the functional code or tests? "Better" means any combination of:
     - more performant
     - better organized / easier to understand / clearer separation of concerns
     - easier to maintain (easier to change, harder to accidentally break)
- Housekeeping
  1. Does the title and description of the PR reference the correct Jira ticket and does it use the correct conventional commit type (e.g., fix, feat, test, breaking change etc)?
     - If the change is breaking, ensure there is an exclamation mark after the scope (e.g., "fix(NODE-xxx)!: \<description\>" )
  1. If there are new TODOs, has a related Jira ticket been created?
  1. Are symbols correctly marked as internal or public?
  1. Do the Typescript types match expected runtime usage? Are there tests for new or updated types?
  1. Should any documentation be updated?
     - Has the relevant internal documentation been updated as part of the PR?
     - Have the external documentation requirements been captured in Jira?

[conventional-commit-style]: https://www.conventionalcommits.org/en/v1.0.0/
[code-of-conduct]: CODE_OF_CONDUCT.md
[github-perfect-pr]: https://blog.github.com/2015-01-21-how-to-write-the-perfect-pull-request/
[mdb-core-values]: https://www.mongodb.com/company/
[nvm-windows]: https://github.com/coreybutler/nvm-windows#installation--upgrades
[nvm-unix]: https://github.com/nvm-sh/nvm#install--update-script
[workspace-file]: https://gist.github.com/W-A-James/5c1330f23ad9359b8b5398695ae2c321
[node-jira]: https://jira.mongodb.org/browse/NODE
