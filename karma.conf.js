'use strict';

const rollupConfig = require('./rollup.config.js');
const scenariosPlugin = require('./tools/scenarios-plugin');
const jsonPlugin = require('rollup-plugin-json');

const onwarn = warning => {
  if (warning.code === 'CIRCULAR_DEPENDENCY' || warning.code === 'EVAL') return;
  console.warn(warning.toString());
};

rollupConfig.onwarn = onwarn;
rollupConfig.plugins.unshift(scenariosPlugin(), jsonPlugin());

// Karma configuration
// Generated on Thu Jun 28 2018 14:24:01 GMT-0400 (EDT)

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha'],
    reporters: ['mocha'],
    files: [{ pattern: 'test/node/!(bson_node_only_test).js', watched: false }],
    preprocessors: {
      'test/node/!(bson_node_only_test).js': 'rollup'
    },
    rollupPreprocessor: rollupConfig,
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadless'],
    singleRun: true,
    concurrency: Infinity
  });
};
