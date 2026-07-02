import { expect } from 'chai';
import * as tar from 'tar';
import * as cp from 'child_process';
import * as fs from 'fs';

const pkg = JSON.parse(fs.readFileSync(__dirname + '/../../package.json', { encoding: 'utf8' }));
const packFile = `bson-${pkg.version}.tgz`;

const REQUIRED_FILES = [
  'LICENSE.md',
  'README.md',
  'bson.d.ts',
  'etc/prepare.js',
  'lib/bson.bundle.js.map',
  'lib/bson.bundle.js',
  'lib/bson.cjs.map',
  'lib/bson.cjs',
  'lib/bson.mjs.map',
  'lib/bson.mjs',
  'lib/bson.node.mjs.map',
  'lib/bson.node.mjs',
  'lib/bson.rn.cjs.map',
  'lib/bson.rn.cjs',
  'package.json',
  'src/binary.ts',
  'src/bson_value.ts',
  'src/bson.ts',
  'src/code.ts',
  'src/constants.ts',
  'src/db_ref.ts',
  'src/decimal128.ts',
  'src/double.ts',
  'src/error.ts',
  'src/extended_json.ts',
  'src/index.ts',
  'src/int_32.ts',
  'src/long.ts',
  'src/max_key.ts',
  'src/min_key.ts',
  'src/objectid.ts',
  'src/parser/calculate_size.ts',
  'src/parser/deserializer.ts',
  'src/parser/serializer.ts',
  'src/parser/utils.ts',
  'src/parser/on_demand/index.ts',
  'src/parser/on_demand/parse_to_elements.ts',
  'src/regexp.ts',
  'src/symbol.ts',
  'src/timestamp.ts',
  'src/utils/byte_utils.ts',
  'src/utils/node_byte_utils.ts',
  'src/utils/number_utils.ts',
  'src/utils/string_utils.ts',
  'src/utils/web_byte_utils.ts',
  'src/utils/latin.ts',
  'src/parse_utf8.ts'
].map(f => `package/${f}`);

describe(`Release ${packFile}`, function () {
  let tarFileList;

  before(function () {
    if (process.arch !== 'x64') {
      // This test doesn't need to run more than once on one of our platforms.
      this.skip();
    }
  });

  before(function () {
    this.timeout(120_000); // npm pack can be slow
    expect(fs.existsSync(packFile), `expected ${packFile} to NOT exist`).to.equal(false);
    cp.execSync('npm pack', { stdio: 'ignore' });
    tarFileList = [];
    tar.list({
      file: packFile,
      sync: true,
      onentry(entry) {
        tarFileList.push(entry.path);
      }
    });
  });

  after(() => {
    try {
      fs.unlinkSync(packFile);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  });

  for (const requiredFile of REQUIRED_FILES) {
    it(`should contain ${requiredFile}`, () => {
      expect(tarFileList).to.includes(requiredFile);
    });
  }

  it('should not have extraneous files', () => {
    const unexpectedFileList = tarFileList.filter(f => !REQUIRED_FILES.some(r => r === f));
    expect(unexpectedFileList).to.have.lengthOf(0, `Extra files: ${unexpectedFileList.join(', ')}`);
  });
});
