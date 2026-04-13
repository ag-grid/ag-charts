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
        limit: '455 kB',
        ...defaultConfig,
    },
    {
        name: 'Cartesian modules',
        import: '{ AllCartesianModule }',
        limit: '369 kB',
        ...defaultConfig,
    },
    {
        name: 'Polar modules',
        import: '{ AllPolarModule }',
        limit: '279 kB',
        ...defaultConfig,
    },
    {
        name: 'Topology modules',
        import: '{ AllMapSeriesModule }',
        limit: '253 kB',
        ...defaultConfig,
    },
    {
        name: 'All enterprise modules',
        import: '{ AllEnterpriseModule }',
        limit: '451 kB',
        ...defaultConfig,
    },
    {
        name: 'BoxPlot module only',
        import: '{ BoxPlotSeriesModule }',
        limit: '248 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules A',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        limit: '293 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules B',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        limit: '252 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules C',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        limit: '257 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules D',
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
        limit: '258 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules E',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        limit: '278 kB',
        ...defaultConfig,
    },
];
