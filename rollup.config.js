'use strict';

const commonjs = require('rollup-plugin-commonjs');
const nodeGlobals = require('rollup-plugin-node-globals');
const nodeBuiltins = require('rollup-plugin-node-builtins');
const nodeResolve = require('rollup-plugin-node-resolve');
const jsonPlugin = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');

const onwarn = warning => {
  if (warning.code === 'CIRCULAR_DEPENDENCY' || warning.code === 'EVAL') return;
  console.warn(warning.toString());
};

module.exports = {
  input: 'index.js',
  output: {
    file: 'dist/bson.js',
    format: 'umd',
    name: 'bson'
  },
  onwarn: onwarn,
  plugins: [
    jsonPlugin(),
    nodeBuiltins(),
    nodeResolve(),
    commonjs(),
    nodeGlobals(),
    babel({
      plugins: ['external-helpers'],
      presets: [
        [
          'env',
          {
            modules: false
          }
        ]
      ]
    })
  ]
};
