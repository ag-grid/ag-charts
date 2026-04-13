const { plugins } = require('../../esbuild.config.cjs');

const sourceConfig = {
    path: './src/main.ts',
    modifyEsbuildConfig(esbuildConfig) {
        esbuildConfig.plugins = plugins;
        return esbuildConfig;
    },
};

const distConfig = {
    path: './dist/package/main.js',
    modifyEsbuildConfig(esbuildConfig) {
        esbuildConfig.plugins = plugins;
        return esbuildConfig;
    },
};

module.exports = [
    {
        name: '[src] Full package',
        import: '*',
        limit: '287 kB',
        ...sourceConfig,
    },
    {
        name: '[src] CartesianChart only',
        import: '{ CartesianChartModule }',
        limit: '175 kB',
        ...sourceConfig,
    },
    {
        name: '[src] PolarChart only',
        import: '{ PolarChartModule }',
        limit: '165 kB',
        ...sourceConfig,
    },
    {
        name: '[dist] Full package',
        import: '*',
        limit: '287 kB',
        ...distConfig,
    },
    {
        name: '[dist] CartesianChart only',
        import: '{ CartesianChartModule }',
        limit: '175 kB',
        ...distConfig,
    },
    {
        name: '[dist] PolarChart only',
        import: '{ PolarChartModule }',
        limit: '165 kB',
        ...distConfig,
    },
];
