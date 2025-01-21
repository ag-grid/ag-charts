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
        limit: '200 kB',
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
    {
        name: 'FlowProportionChart only',
        import: '{ FlowProportionChartModule }',
        limit: '200 kB',
        ...defaultConfig,
    },
    {
        name: 'GaugeChart only',
        import: '{ GaugeChartModule }',
        limit: '200 kB',
        ...defaultConfig,
    },
    {
        name: 'HierarchyChart only',
        import: '{ HierarchyChartModule }',
        limit: '200 kB',
        ...defaultConfig,
    },
    {
        name: 'StandaloneChart only',
        import: '{ StandaloneChartModule }',
        limit: '200 kB',
        ...defaultConfig,
    },
    {
        name: 'TopologyChart only',
        import: '{ TopologyChartModule }',
        limit: '200 kB',
        ...defaultConfig,
    },
];
