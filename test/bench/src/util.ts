export type PerfSendData = {
  info: {
    test_name: string;
    tags?: string[];
    args?: Record<string, string>;
  };
  metrics: { name: string; value: number }[];
};

export function convertToPerfSendFormat(
  benchmarkName: string,
  metrics: {
    name: string;
    results: number[];
  }[],
  args?: Record<string, string>
): PerfSendData {
  return {
    info: {
      test_name: benchmarkName.replaceAll(' ', '_'),
      tags: ['js-bson'],
      args: args
    },
    metrics: metrics.map(({ name, results }) => ({
      name,
      value: results.reduce((acc, x) => acc + x, 0) / results.length
    }))
  };
}
