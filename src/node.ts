import { randomBytes } from 'node:crypto';

import { nodeJsByteUtils } from './utils/node_byte_utils';
nodeJsByteUtils.randomBytes = randomBytes;

export * from './index';
