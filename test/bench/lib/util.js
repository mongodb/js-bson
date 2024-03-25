"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToPerfSendFormat = void 0;
function convertToPerfSendFormat(benchmarkName, metrics, args) {
    return {
        info: {
            test_name: benchmarkName.replaceAll(' ', '_'),
            tags: ['js-bson'],
            args: args
        },
        metrics: metrics.map(({ name, results }) => ({
            name,
            value: results.reduce((acc, x) => acc + x, 0) / results.length
        }))
    };
}
exports.convertToPerfSendFormat = convertToPerfSendFormat;
//# sourceMappingURL=util.js.map