# Custom Benchmark Tests

In this directory are tests for code paths not covered by our spec or granular (de)serialization benchmarks.

## How to write your own

In `main.mjs` call the `.add` function and pass it an underscore concatenated descriptive title.
Try to fit the title into the format of: "subject area", "method or function" "test case that is being covered" (Ex. `objectid_isvalid_bestcase_false`).
Copy the title to the name of the function to assist with debugging and flamegraph capturing.

### Example

```js
.add('subject_function_testcase', function subject_function_testcase() {
  BSON.ObjectId.isValid('g6e84ebdc96f4c0772f0cbbf');
})
```

## Output

The JSON emitted at the end of the benchmarks must follow our performance tracking format.

The JSON must be an array of "`Test`"s:

```ts
type Metric = { name: string, value: number }
type Test = {
    info: { test_name: string },
    metrics: Metric[]
}
```

The metric collected is always "ops_per_sec" so higher is better.
