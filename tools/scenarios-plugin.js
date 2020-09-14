'use strict';

const scenariosPlugin = () => {
  return {
    name: 'scenarios',
    load(id) {
      if (id.includes('bson_corpus_test_loader.js')) {
        const corpus = require('../test/node/tools/bson_corpus_test_loader');
        return {
          code: `export default ${JSON.stringify(corpus)};\n`,
          map: { mappings: '' }
        };
      }
    }
  };
};

module.exports = scenariosPlugin;
