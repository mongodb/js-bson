'use strict';

const scenariosPlugin = require('./tools/scenarios-plugin');
const jsonPlugin = require('rollup-plugin-json');
const nodeGlobals = require('rollup-plugin-node-globals');
const nodeBuiltins = require('rollup-plugin-node-builtins');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');

const rollupPlugins = [
  scenariosPlugin(),
  nodeResolve({
    browser: true,
    preferBuiltins: false
  }),
  commonjs({
    namedExports: {
      'node_modules/buffer/index.js': ['isBuffer']
    }
  }),
  nodeBuiltins(),
  nodeGlobals(),
  jsonPlugin()
];

const rollupConfig = {
  plugins: rollupPlugins,
  output: {
    format: 'iife',
    name: 'BSONtest',
    exports: 'named'
  }
};

const onwarn = warning => {
  if (warning.code === 'CIRCULAR_DEPENDENCY' || warning.code === 'EVAL') return;
  console.warn(warning.toString());
};

rollupConfig.onwarn = onwarn;

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha'],
    reporters: ['mocha'],
    files: [{ pattern: 'test/node/!(bson_node_only_tests).js', watched: false }],
    preprocessors: {
      'test/node/!(bson_node_only_tests).js': 'rollup'
    },
    rollupPreprocessor: rollupConfig,
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },
    singleRun: true,
    concurrency: Infinity
  });
};
