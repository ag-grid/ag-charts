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
    { name: '[src] Full package', import: '*', limit: '455 kB', ...sourceConfig },
    { name: '[src] BoxPlot module only', import: '{ BoxPlotSeriesModule }', limit: '248 kB', ...sourceConfig },
    {
        name: '[src] Mixed modules A',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        limit: '293 kB',
        ...sourceConfig,
    },
    {
        name: '[src] Mixed modules B',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        limit: '252 kB',
        ...sourceConfig,
    },
    {
        name: '[src] Mixed modules C',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        limit: '257 kB',
        ...sourceConfig,
    },
    {
        name: '[src] Mixed modules D',
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
        limit: '258 kB',
        ...sourceConfig,
    },
    {
        name: '[src] Mixed modules E',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        limit: '278 kB',
        ...sourceConfig,
    },
    { name: '[dist] Full package', import: '*', limit: '455 kB', ...distConfig },
    { name: '[dist] BoxPlot module only', import: '{ BoxPlotSeriesModule }', limit: '248 kB', ...distConfig },
    {
        name: '[dist] Mixed modules A',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        limit: '293 kB',
        ...distConfig,
    },
    {
        name: '[dist] Mixed modules B',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        limit: '252 kB',
        ...distConfig,
    },
    {
        name: '[dist] Mixed modules C',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        limit: '257 kB',
        ...distConfig,
    },
    {
        name: '[dist] Mixed modules D',
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
        limit: '258 kB',
        ...distConfig,
    },
    {
        name: '[dist] Mixed modules E',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        limit: '278 kB',
        ...distConfig,
    },
];
