const { plugins } = require('../../esbuild.config.cjs');

const defaultConfig = {
    path: './src/main-modules.ts',
    modifyEsbuildConfig(esbuildConfig) {
        // Uncomment to disable minification when investigating:
        // esbuildConfig.minifyIdentifiers = false;
        // esbuildConfig.minifySyntax = false;
        // esbuildConfig.minifyWhitespace = false;
        esbuildConfig.plugins = plugins;
        return esbuildConfig;
    },
};

module.exports = [
    {
        name: 'Full package',
        import: '*',
        limit: '210 kB',
        ...defaultConfig,
    },
    {
        name: 'CartesianChart only',
        import: '{ CartesianChartModule }',
        limit: '200 kB',
        ...defaultConfig,
    },
    {
        name: 'PolarChart only',
        import: '{ PolarChartModule }',
        limit: '200 kB',
        ...defaultConfig,
    },
];
