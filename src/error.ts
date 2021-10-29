/** @public */
export class BSONError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, BSONError.prototype);
  }

  get name(): string {
    return 'BSONError';
  }
}

/** @public */
export class BSONTypeError extends TypeError {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, BSONTypeError.prototype);
  }

  get name(): string {
    return 'BSONTypeError';
  }
}
