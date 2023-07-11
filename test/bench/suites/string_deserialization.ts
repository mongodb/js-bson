import { Suite } from '../suite';

export function getStringDeserializationSuite(BSON): Suite {
  const DOC: Uint8Array = BSON.serialize({
    nextBatch: Array.from({ length: 1000 }, () => {
      return {
        _id: new BSON.ObjectId(),
        arrayField: Array.from({ length: 20 }, (_, i) => '5e99f3f5d3ab06936d36000' + i)
      };
    })
  });
  const suite = new Suite('String Deserialization');
  for (const utf8Validation of [true, false]) {
    suite.task({
      name: `stringDeserializationUTF8${utf8Validation ? 'On' : 'Off'}-${
        process.env.WEB === 'true' ? 'web' : 'node'
      }`,
      data: DOC,
      fn: serializedDoc =>
        BSON.deserialize(serializedDoc, { validation: { utf8: utf8Validation } }),
      iterations: 1000,
      resultUnit: 'megabytes_per_second',
      transform: (runtimeMS: number) => {
        return DOC.byteLength / runtimeMS;
      }
    });
  }

  return suite;
}
