/* eslint-disable strict */
import { BSON } from '../../../lib/bson.mjs';

const ObjectId_isValid = [
  function objectid_isvalid_strlen() {
    BSON.ObjectId.isValid('a');
  },
  /** wrong character at the start */
  function objectid_isvalid_most_short_circuit_false() {
    BSON.ObjectId.isValid('g6e84ebdc96f4c0772f0cbbf');
  },
  /** wrong character at the end */
  function objectid_isvalid_least_short_circuit_false() {
    BSON.ObjectId.isValid('66e84ebdc96f4c0772f0cbbg');
  },
  function objectid_isvalid_true() {
    BSON.ObjectId.isValid('66e84ebdc96f4c0772f0cbbf');
  }
];

// Add benchmarks here:
export const benchmarks = [...ObjectId_isValid];
