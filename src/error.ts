/** @public */
export class BSONError extends Error {
  get name(): string {
    return 'BSONError';
  }
}

/** @public */
export class BSONTypeError extends TypeError {
  get name(): string {
    return 'BSONTypeError';
  }
}
