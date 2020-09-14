'use strict';

const pkg = require('./package.json');
const commonjs = require('rollup-plugin-commonjs');
const nodeBuiltins = require('rollup-plugin-node-builtins');
const nodeResolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');

const input = 'lib/bson.js';
const plugins = [
  nodeResolve(),
  commonjs(),
  nodeBuiltins(),
  babel({
    externalHelpers: true,
    presets: [
      [
        '@babel/env',
        {
          modules: false
        }
      ]
    ]
  })
];

const browserPlugins = [
  nodeResolve({
    browser: true,
    preferBuiltins: false
  }),
  commonjs(),
  nodeBuiltins(),
  babel({
    externalHelpers: true,
    presets: [
      [
        '@babel/env',
        {
          modules: false
        }
      ]
    ]
  })
];

const external = Object.keys(pkg.dependencies || {});
const defaultName = 'BSON';

module.exports = [
  {
    input,
    output: {
      file: 'dist/bson.esm.js',
      format: 'es',
      name: defaultName,
      exports: 'named'
    },
    plugins,
    external
  },
  {
    input,
    output: {
      file: 'dist/bson.browser.umd.js',
      format: 'umd',
      name: defaultName,
      exports: 'named',
      globals: {
        buffer: 'Buffer'
      }
    },
    plugins: browserPlugins,
    external
  },
  {
    input,
    output: {
      file: 'dist/bson.browser.esm.js',
      format: 'es',
      name: defaultName,
      exports: 'named'
    },
    plugins: browserPlugins,
    external
  },
  {
    input,
    output: {
      file: 'dist/bson.bundle.js',
      format: 'iife',
      name: defaultName,
      exports: 'named'
    },
    plugins: browserPlugins
  }
];
