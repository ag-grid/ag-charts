export const BENCHMARK_START = '/** BENCHMARK START **/';
export const BENCHMARK_END = '/** BENCHMARK END **/';

export const getBenchmarkSnippet = () =>
    `${BENCHMARK_START}
// Benchmark loader - imports and initializes the benchmark runner
import('./benchmark.js').then(({ initBenchmark }) => {
    if (typeof getBenchmarkConfig === 'function') {
        initBenchmark(getBenchmarkConfig());
    }
});
${BENCHMARK_END}`;
