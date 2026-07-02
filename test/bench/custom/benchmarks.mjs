/* eslint-disable strict */
import { BSON } from '../../../lib/bson.mjs';

const ObjectId_isValid = {
  name: 'ObjectId_isValid',
  tags: ['alerting-benchmark', 'objectid'],
  benchmarks: [
    function objectid_isvalid_wrong_string_length() {
      BSON.ObjectId.isValid('a');
    },
    /** wrong character at the start, could be the most short circuited code path */
    function objectid_isvalid_invalid_hex_at_start() {
      BSON.ObjectId.isValid('g6e84ebdc96f4c0772f0cbbf');
    },
    /** wrong character at the end, could be the least short circuited code path */
    function objectid_isvalid_invalid_hex_at_end() {
      BSON.ObjectId.isValid('66e84ebdc96f4c0772f0cbbg');
    },
    function objectid_isvalid_valid_hex_string() {
      BSON.ObjectId.isValid('66e84ebdc96f4c0772f0cbbf');
    }
  ]
};

// Add benchmarks here:
export const suites = [ObjectId_isValid];
