import { Task } from './task';
import { PerfSendData } from './util';

export class Suite {
  name: string;
  tasks: Task[];
  results: PerfSendData[];
  constructor(name: string) {
    this.name = name;
    this.tasks = [];
    this.results = [];
  }

  task(opts: {
    name: string;
    data: any;
    fn: (data: any) => void;
    iterations: number;
    args?: Record<string, any>;
  }) {
    this.tasks.push(new Task(this, opts.name, opts.data, opts.fn, opts.iterations, opts.args));
    return this;
  }

  run() {
    console.log(`Running suite: ${this.name}`);

    for (const task of this.tasks) {
      task.run();
    }
  }
}
