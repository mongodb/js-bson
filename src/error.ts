/** @public */
export class BSONError extends Error {
  constructor(message: string) {
    super(message);
  }

  get name(): string {
    return 'BSONError';
  }
}

/** @public */
export class BSONTypeError extends TypeError {
  constructor(message: string) {
    super(message);
  }

  get name(): string {
    return 'BSONTypeError';
  }
}
