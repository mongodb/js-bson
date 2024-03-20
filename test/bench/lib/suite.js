"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Suite = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const task_1 = require("./task");
class Suite {
    constructor(name) {
        this.name = name;
        this.tasks = [];
        this.results = [];
    }
    task(opts) {
        this.tasks.push(new task_1.Task(this, opts.name, opts.data, opts.fn, opts.iterations, opts.resultUnit, opts.transform, opts.args));
        return this;
    }
    run() {
        console.log(`Running suite: ${this.name}`);
        for (const task of this.tasks) {
            task.run();
        }
    }
}
exports.Suite = Suite;
//# sourceMappingURL=suite.js.map