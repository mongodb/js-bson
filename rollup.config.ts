const pkg = require('./package.json');
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import sucrase from '@rollup/plugin-sucrase';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';

function listPlugins(browser = false) {
  return [
    resolve({
      extensions: ['.js', '.ts'],
      browser,
      preferBuiltins: !browser
    }),
    sucrase({
      exclude: ['node_modules/**'],
      transforms: ['typescript']
    }),
    globals(),
    builtins(),
    commonjs(),
    babel({
      babelHelpers: 'external',
      plugins: ['@babel/plugin-external-helpers'],
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
}

export default [
  {
    input: 'src/bson.ts',
    output: {
      file: 'dist/bundle.js',
      format: 'cjs'
    },
    external: Object.keys(pkg.dependencies || {}),
    plugins: listPlugins()
  },
  {
    input: 'src/bson.ts',
    output: {
      file: 'dist/bson.esm.js',
      format: 'es',
      exports: 'named'
    },
    external: Object.keys(pkg.dependencies || {}),
    plugins: listPlugins()
  },
  {
    input: 'src/bson.ts',
    output: {
      file: 'dist/bson.browser.esm.js',
      format: 'es',
      exports: 'named'
    },
    external: Object.keys(pkg.dependencies || {}),
    plugins: listPlugins(true)
  },
  {
    input: 'src/bson.ts',
    output: {
      file: 'dist/bson.umd.js',
      format: 'umd',
      name: 'BSON',
      exports: 'named',
      globals: {
        buffer: 'Buffer'
      }
    },
    external: Object.keys(pkg.dependencies || {}),
    plugins: listPlugins(true)
  },
  {
    input: 'src/bson.ts',
    output: {
      file: 'dist/bson.bundle.js',
      format: 'iife',
      exports: 'named'
    },
    external: Object.keys(pkg.dependencies || {}),
    plugins: listPlugins(true)
  }
];
