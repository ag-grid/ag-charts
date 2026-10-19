const { plugins } = require('../../esbuild.config.cjs');

const scenarios = [
    {
        name: 'Full package',
        import: '*',
        srcLimit: '351 kB',
        distLimit: '352 kB',
    },
    {
        name: 'CartesianChart only',
        import: '{ CartesianChartModule }',
        srcLimit: '223 kB',
        distLimit: '335 kB',
    },
    {
        name: 'PolarChart only',
        import: '{ PolarChartModule }',
        srcLimit: '188 kB',
        distLimit: '336 kB',
    },
];

module.exports = scenarios.flatMap(({ name, import: imp, srcLimit, distLimit }) => [
    {
        name: `[src] ${name}`,
        import: imp,
        limit: srcLimit,
        path: './src/main.ts',
        modifyEsbuildConfig(config) {
            config.plugins = plugins;
            return config;
        },
    },
    {
        name: `[dist] ${name}`,
        import: imp,
        limit: distLimit,
        path: './dist/package/main.esm.mjs',
        modifyEsbuildConfig(config) {
            config.plugins = plugins;
            return config;
        },
    },
]);
