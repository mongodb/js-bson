'use strict';

const path = require('path');
const fs = require('fs');

/**
 * @typedef {object} DecodeErrorTest
 * @property {string} description
 * @property {string} bson
 */

/**
 * @typedef {object} ParseErrorTest
 * @property {string} description
 * @property {string} string
 */

/**
 * @typedef {object} ValidTest
 * @property {string} description
 * @property {string} canonical_bson
 * @property {string} [canonical_extjson]
 * @property {string} [degenerate_extjson]
 * @property {string} [converted_bson]
 * @property {string} [converted_extjson]
 * @property {string} [degenerate_bson]
 * @property {boolean} [lossy]
 * @property {string} [relaxed_extjson]
 */

/**
 * @typedef {object} BSONCorpus
 * @property {string} _filename
 * @property {string} description
 * @property {string} bson_type
 * @property {string} test_key
 * @property {ValidTest[]} valid
 * @property {DecodeErrorTest[]} [decodeErrors]
 * @property {ParseErrorTest[]} [parseErrors]
 * @property {boolean} [deprecated]
 */

/**
 * @returns {BSONCorpus[]}
 */
function findScenarios() {
  return fs
    .readdirSync(path.join(__dirname, '../specs/bson-corpus'))
    .filter(x => x.indexOf('json') !== -1)
    .map(x =>
      Object.assign(
        JSON.parse(fs.readFileSync(path.join(__dirname, '../specs/bson-corpus', x), 'utf8')),
        { _filename: x.replace('.json', '') }
      )
    );
}

module.exports = findScenarios();
