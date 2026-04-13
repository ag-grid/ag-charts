const { plugins } = require('../../esbuild.config.cjs');

const defaultConfig = {
    path: './src/main.ts',
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
        limit: '287 kB',
        ...defaultConfig,
    },
    {
        name: 'CartesianChart only',
        import: '{ CartesianChartModule }',
        limit: '175 kB',
        ...defaultConfig,
    },
    {
        name: 'PolarChart only',
        import: '{ PolarChartModule }',
        limit: '165 kB',
        ...defaultConfig,
    },
];
