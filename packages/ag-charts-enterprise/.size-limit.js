const { plugins } = require('../../esbuild.config.cjs');

const defaultConfig = {
    path: './src/main.ts',
    modifyEsbuildConfig(esbuildConfig) {
        esbuildConfig.plugins = plugins;
        return esbuildConfig;
    },
};

const distConfig = {
    path: './dist/package/main.esm.mjs',
    modifyEsbuildConfig(esbuildConfig) {
        esbuildConfig.plugins = plugins;
        return esbuildConfig;
    },
};

module.exports = [
    { name: 'Full package', import: '*', limit: '455 kB', ...defaultConfig },
    { name: 'BoxPlot module only', import: '{ BoxPlotSeriesModule }', limit: '248 kB', ...defaultConfig },
    { name: 'Mixed modules A', import: '{ BoxPlotSeriesModule, NavigatorModule }', limit: '293 kB', ...defaultConfig },
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
    { name: '[dist] Full package', import: '*', limit: '455 kB', ...distConfig },
    { name: '[dist] BoxPlot module only', import: '{ BoxPlotSeriesModule }', limit: '330 kB', ...distConfig },
    {
        name: '[dist] Mixed modules A',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        limit: '360 kB',
        ...distConfig,
    },
    {
        name: '[dist] Mixed modules B',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        limit: '330 kB',
        ...distConfig,
    },
    {
        name: '[dist] Mixed modules C',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        limit: '330 kB',
        ...distConfig,
    },
    {
        name: '[dist] Mixed modules D',
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
        limit: '330 kB',
        ...distConfig,
    },
    {
        name: '[dist] Mixed modules E',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        limit: '350 kB',
        ...distConfig,
    },
];
