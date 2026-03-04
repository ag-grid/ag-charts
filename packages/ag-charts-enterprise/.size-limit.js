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
        limit: '446 kB',
        ...defaultConfig,
    },
    {
        name: 'Cartesian modules',
        import: '{ AllCartesianModule }',
        limit: '344 kB',
        ...defaultConfig,
    },
    {
        name: 'Polar modules',
        import: '{ AllPolarModule }',
        limit: '274 kB',
        ...defaultConfig,
    },
    {
        name: 'Topology modules',
        import: '{ AllMapSeriesModule }',
        limit: '282 kB',
        ...defaultConfig,
    },
    {
        name: 'All enterprise modules',
        import: '{ AllEnterpriseModule }',
        limit: '435 kB',
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
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
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
