const { plugins } = require('../../esbuild.config.cjs');

const defaultConfig = {
    path: './src/main.ts',
    modifyEsbuildConfig(esbuildConfig) {
        esbuildConfig.plugins = plugins;
        return esbuildConfig;
    },
};

module.exports = [
    {
        name: 'Full package',
        import: '*',
        limit: '404 kB',
        ...defaultConfig,
    },
    {
        name: 'Cartesian enterprise modules',
        import: '{ AllCartesianEnterpriseModules }',
        limit: '343 kB',
        ...defaultConfig,
    },
    {
        name: 'Polar enterprise modules',
        import: '{ AllPolarEnterpriseModules }',
        limit: '274 kB',
        ...defaultConfig,
    },
    {
        name: 'Standalone enterprise modules',
        import: '{ AllStandaloneEnterpriseModules }',
        limit: '290 kB',
        ...defaultConfig,
    },
    {
        name: 'Topology enterprise modules',
        import: '{ AllTopologyEnterpriseModules }',
        limit: '282 kB',
        ...defaultConfig,
    },
    {
        name: 'All enterprise modules',
        import: '{ AllEnterpriseModules }',
        limit: '396 kB',
        ...defaultConfig,
    },
    {
        name: 'BoxPlot module only',
        import: '{ BoxPlotSeriesModule }',
        limit: '258 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules A',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        limit: '280 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules B',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        limit: '265 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules C',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        limit: '267 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules D',
        import: '{ HeatmapSeriesModule, LinearGaugeSeriesModule, DataSourceModule, ContextMenuModule, ForegroundModule }',
        limit: '267 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules E',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        limit: '280 kB',
        ...defaultConfig,
    },
];
