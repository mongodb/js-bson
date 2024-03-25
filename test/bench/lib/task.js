"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const util_1 = require("./util");
/* eslint-disable @typescript-eslint/no-explicit-any */
const perf_hooks_1 = require("perf_hooks");
class Task {
    constructor(parent, name, data, fn, iterations, resultUnit, transform, args) {
        this.parent = parent;
        this.name = name;
        this.iterations = iterations;
        this.data = data;
        this.fn = fn;
        this.transform = transform;
        this.args = args;
        this.resultUnit = resultUnit ? resultUnit : 'ms';
    }
    // TODO: Ensure that each task runs on a separate node process
    run() {
        console.log(`\t ${this.name} - iters: ${this.iterations}`);
        const data = this.data;
        const fn = this.fn;
        // Warmup
        for (let i = 0; i < this.iterations; i++) {
            fn(data);
        }
        const results = [];
        for (let i = 0; i < this.iterations; i++) {
            const start = perf_hooks_1.performance.now();
            fn(data);
            const end = perf_hooks_1.performance.now();
            results.push(end - start); // ms
        }
        this.parent.results.push((0, util_1.convertToPerfSendFormat)(this.name, [
            {
                name: this.resultUnit,
                results: this.transform ? results.map(this.transform) : results
            }
        ], this.args));
    }
}
exports.Task = Task;
//# sourceMappingURL=task.js.map