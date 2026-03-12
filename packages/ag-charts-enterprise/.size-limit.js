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
        limit: '448 kB',
        ...defaultConfig,
    },
    {
        name: 'Cartesian modules',
        import: '{ AllCartesianModule }',
        limit: '353 kB',
        ...defaultConfig,
    },
    {
        name: 'Polar modules',
        import: '{ AllPolarModule }',
        limit: '275 kB',
        ...defaultConfig,
    },
    {
        name: 'Topology modules',
        import: '{ AllMapSeriesModule }',
        limit: '249 kB',
        ...defaultConfig,
    },
    {
        name: 'All enterprise modules',
        import: '{ AllEnterpriseModule }',
        limit: '443 kB',
        ...defaultConfig,
    },
    {
        name: 'BoxPlot module only',
        import: '{ BoxPlotSeriesModule }',
        limit: '244 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules A',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        limit: '289 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules B',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        limit: '248 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules C',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        limit: '253 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules D',
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
        limit: '254 kB',
        ...defaultConfig,
    },
    {
        name: 'Mixed modules E',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        limit: '273 kB',
        ...defaultConfig,
    },
];
