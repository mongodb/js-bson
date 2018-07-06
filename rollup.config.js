'use strict';

const commonjs = require('rollup-plugin-commonjs');
const nodeGlobals = require('rollup-plugin-node-globals');
const nodeBuiltins = require('rollup-plugin-node-builtins');
const nodeResolve = require('rollup-plugin-node-resolve');
const jsonPlugin = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');
const fs = require('fs');
const path = require('path');

const scenariosPlugin = options => { // eslint-disable-line
  return {
    name: 'scenarios',
    transform(json, id) {
      if (id.includes('bson_corpus_test_loader.js')) {
        const corpus = fs
          .readdirSync(path.join(__dirname, './test/node/specs/bson-corpus'))
          .filter(x => x.indexOf('json') !== -1)
          .map(x =>
            fs.readFileSync(path.join(__dirname, './test/node/specs/bson-corpus', x), 'utf8')
          );
        return {
          code: `export default [ ${corpus.join(',')} ];\n`,
          map: { mappings: '' }
        };
      }
    }
  };
};

module.exports = {
  input: 'index.js',
  output: {
    file: 'dist/bson.js',
    format: 'umd',
    name: 'bson'
  },
  plugins: [
    scenariosPlugin(),
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
