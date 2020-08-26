const { scenariosPlugin } = require('./tools/scenarios-plugin');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const nodeGlobals = require('rollup-plugin-node-globals');
const nodeBuiltins = require('rollup-plugin-node-builtins');
const typescript = require('@rollup/plugin-typescript');
const rollupJson = require('@rollup/plugin-json');
const { readFileSync } = require('fs');
const JSON5 = require('json5');

// TSConfig has comments so we need a json5 parser
const { compilerOptions, include } = JSON5.parse(
  readFileSync('./tsconfig.json', { encoding: 'utf8' })
);

// Modify ts config options for use with rollup
// remove all settings relating to declarations
delete compilerOptions.declarationDir;
delete compilerOptions.emitDeclarationOnly;
delete compilerOptions.outDir;

const allTSSettings = {
  ...compilerOptions,
  sourceMap: true,
  inlineSourceMap: false,
  inlineSources: false,
  declarationMap: false,
  declaration: false,
  // rollup understands esm modules
  module: 'esnext',
  // old browsers
  target: 'es3',
  tsconfig: false,
  include
};

module.exports = function (config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'],

    // list of files / patterns to load in the browser
    files: [{ pattern: 'test/node/!(bson_node_only_tests).js', watched: false }],

    // list of files / patterns to exclude
    exclude: ['src/**/*.ts'],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/node/!(bson_node_only_tests).js': ['rollup']
    },

    rollupPreprocessor: {
      plugins: [
        typescript(allTSSettings),
        scenariosPlugin(),
        nodeResolve({ browser: true, preferBuiltins: false }),
        commonjs(),
        nodeBuiltins({ buffer: true }),
        nodeGlobals({ buffer: true }),
        rollupJson()
      ],
      output: {
        format: 'iife',
        name: 'BSONtest',
        sourcemap: true,
        exports: 'named'
      }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: 1
  });
};
