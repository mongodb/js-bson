"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const string_deserialization_1 = require("./suites/string_deserialization");
const fs_1 = require("fs");
const os_1 = require("os");
const hw = (0, os_1.cpus)();
const platform = { name: hw[0].model, cores: hw.length, ram: `${(0, os_1.totalmem)() / 1024 ** 3}GiB` };
const results = [];
console.log([
    `\n- cpu: ${platform.name}`,
    `- cores: ${platform.cores}`,
    `- os: ${process.platform}`,
    `- ram: ${platform.ram}`
].join('\n'));
for (const suite of [(0, string_deserialization_1.getStringDeserializationSuite)()]) {
    suite.run();
    results.push(suite.results);
}
(0, fs_1.writeFile)('benchmarks.json', JSON.stringify(results.flat()), err => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('Wrote results to benchmarks.json');
});
//# sourceMappingURL=index.js.map