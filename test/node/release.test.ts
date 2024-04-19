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
  'lib/bson.bundle.js',
  'lib/bson.bundle.js.map',
  'lib/bson.cjs',
  'lib/bson.cjs.map',
  'lib/bson.mjs',
  'lib/bson.mjs.map',
  'lib/bson.rn.cjs',
  'lib/bson.rn.cjs.map',
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
  'src/validate_utf8.ts',
  'vendor/base64/base64.js',
  'vendor/base64/package.json',
  'vendor/base64/LICENSE-MIT.txt',
  'vendor/base64/README.md',
  'vendor/text-encoding/lib/encoding-indexes.js',
  'vendor/text-encoding/lib/encoding.js',
  'vendor/text-encoding/index.js',
  'vendor/text-encoding/package.json',
  'vendor/text-encoding/LICENSE.md',
  'vendor/text-encoding/README.md'
].map(f => `package/${f}`);

describe(`Release ${packFile}`, function () {
  let tarFileList;
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
    fs.unlinkSync(packFile);
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
