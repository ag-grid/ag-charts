const { plugins } = require('../../esbuild.config.cjs');

const scenarios = [
    {
        name: 'Full package',
        import: '*',
        srcLimit: '315 kB',
        distLimit: '315 kB',
    },
    {
        name: 'CartesianChart only',
        import: '{ CartesianChartModule }',
        srcLimit: '186 kB',
        distLimit: '292 kB',
    },
    {
        name: 'PolarChart only',
        import: '{ PolarChartModule }',
        srcLimit: '174 kB',
        distLimit: '292 kB',
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
