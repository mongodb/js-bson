# Custom Benchmark Tests

In this directory are tests for code paths not covered by our spec or granular (de)serialization benchmarks.

## How to write your own

In `benchmarks.mjs` add a new test to an existing benchmark object or make a new object for a new subject area.
Try to fit the name of the variables and the benchmark functions into the format of: "subject area", "method or function" "test case that is being covered" (Ex. `objectid_isvalid_bestcase_false`).
Make sure your test is added to the `benchmarks` export.

### Example

```js
const ObjectId_isValid = {
  name: 'ObjectId_isValid',
  tags: ['objectid'],
  benchmarks : [
    function objectid_isvalid_strlen() {
      BSON.ObjectId.isValid('a');
    },
    // ...
  ]
};

export const benchmarks = [ObjectId_isValid];
```

## Output

The JSON emitted at the end of the benchmarks must follow our performance tracking format.

The JSON must be an array of "`Test`"s:

```ts
type Metric = { name: string, value: number, metadata: { improvement_diraction: 'up' | 'down' } }
type Test = {
    info: { test_name: string, tags?: string[]},
    metrics: Metric[]
}
```

The metric collected is always "ops_per_sec" so higher is better.
