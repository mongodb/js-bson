const scenariosPlugin = require('./tools/scenarios-plugin');

import commonjs from '@rollup/plugin-commonjs';
import jsonPlugin from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import nodeGlobals from 'rollup-plugin-node-globals';

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
  } as any),
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

(rollupConfig as any).onwarn = onwarn;

export default function (config) {
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
}
