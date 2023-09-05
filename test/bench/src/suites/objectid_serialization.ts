import { Suite } from '../suite';
import * as BSON from '../../../../';

export function getObjectIdSerializationSuite(): Suite {
  const suite = new Suite('objectid serialization');
  const data = {
    docs: Array.from({ length: 1_000 }, () => new BSON.ObjectId())
  };

  suite.task({
    name: 'ObjectId serialization',
    data,
    fn: objectIds => {
      BSON.serialize(objectIds);
    },
    iterations: 10_000,
    resultUnit: 'megabytes_per_second',
    transform: (runtimeMS: number) => {
      return BSON.calculateObjectSize(data) / 1024 ** 2 / (runtimeMS / 1000);
    }
  });

  return suite;
}
