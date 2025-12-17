export const BENCHMARK_START = '/** BENCHMARK START **/';
export const BENCHMARK_END = '/** BENCHMARK END **/';

export const getBenchmarkSnippet = () =>
    `${BENCHMARK_START}
// Benchmark loader - imports and initializes the benchmark harness
import('./benchmarkHarness.js').then(({ initBenchmark }) => {
    if (typeof getBenchmarkConfig === 'function') {
        initBenchmark(getBenchmarkConfig());
    }
});
${BENCHMARK_END}`;
