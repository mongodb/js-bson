'use strict';

const fs = require('fs');
const path = require('path');

const scenariosPlugin = () => {
  return {
    name: 'scenarios',
    transform(json, id) {
      if (id.includes('bson_corpus_test_loader.js')) {
        const corpus = fs
          .readdirSync(path.join(__dirname, '../test/node/specs/bson-corpus'))
          .filter(x => x.indexOf('json') !== -1)
          .map(x =>
            fs.readFileSync(path.join(__dirname, '../test/node/specs/bson-corpus', x), 'utf8')
          );
        return {
          code: `export default [ ${corpus.join(',')} ];\n`,
          map: { mappings: '' }
        };
      }
    }
  };
};

module.exports = scenariosPlugin;
