'use strict';

const rollupConfig = require('./rollup.config.js');
delete rollupConfig.input;

// Karma configuration
// Generated on Thu Jun 28 2018 14:24:01 GMT-0400 (EDT)

module.exports = function(config) {
  config.set({
    basePath: '',

    frameworks: ['mocha'],

    reporters: ['mocha'],

    files: [{ pattern: 'test/node/*.js', watched: false }],

    preprocessors: {
      'test/node/*.js': 'rollup'
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
