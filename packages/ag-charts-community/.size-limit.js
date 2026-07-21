const { plugins } = require('../../esbuild.config.cjs');

const scenarios = [
    {
        name: 'Full package',
        import: '*',
        srcLimit: '331 kB',
        distLimit: '331 kB',
    },
    {
        name: 'CartesianChart only',
        import: '{ CartesianChartModule }',
        srcLimit: '196 kB',
        distLimit: '307 kB',
    },
    {
        name: 'PolarChart only',
        import: '{ PolarChartModule }',
        srcLimit: '185 kB',
        distLimit: '307 kB',
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
