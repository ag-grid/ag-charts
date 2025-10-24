const { plugins } = require('../../esbuild.config.cjs');

const defaultConfig = {
    path: './src/main-modules.ts',
    brotli: false,
    modifyEsbuildConfig(esbuildConfig) {
        esbuildConfig.plugins = plugins;
        return esbuildConfig;
    },
};

module.exports = [
    {
        name: 'Full package',
        import: '*',
        limit: '1.8 MB',
        ...defaultConfig,
    },
    {
        name: 'Cartesian enterprise modules',
        import: '{ AllCartesianEnterpriseModules }',
        limit: '1.5 MB',
        ...defaultConfig,
    },
    {
        name: 'Polar enterprise modules',
        import: '{ AllPolarEnterpriseModules }',
        limit: '1.2 MB',
        ...defaultConfig,
    },
    {
        name: 'Standalone enterprise modules',
        import: '{ AllStandaloneEnterpriseModules }',
        limit: '1.2 MB',
        ...defaultConfig,
    },
    {
        name: 'Topology enterprise modules',
        import: '{ AllTopologyEnterpriseModules }',
        limit: '1.2 MB',
        ...defaultConfig,
    },
    {
        name: 'All enterprise modules',
        import: '{ AllEnterpriseModules }',
        limit: '1.8 MB',
        ...defaultConfig,
    },
    {
        name: 'BoxPlot module only',
        import: '{ BoxPlotSeriesModule }',
        limit: '1.1 MB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules A',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        limit: '1.2 MB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules B',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        limit: '1.1 MB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules C',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        limit: '1.1 MB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules D',
        import: '{ HeatmapSeriesModule, LinearGaugeSeriesModule, DataSourceModule, ContextMenuModule, ForegroundModule }',
        limit: '1.1 MB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules E',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        limit: '1.2 MB',
        ...defaultConfig,
    },
];
