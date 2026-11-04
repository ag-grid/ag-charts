const { plugins } = require('../../esbuild.config.cjs');

const scenarios = [
    {
        name: 'Full package',
        import: '*',
        srcLimit: '571 kB',
        distLimit: '571 kB',
    },
    {
        name: 'BoxPlot module only',
        import: '{ BoxPlotSeriesModule }',
        srcLimit: '303 kB',
        distLimit: '303 kB',
    },
    {
        name: 'Mixed modules A',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        srcLimit: '367 kB',
        distLimit: '367 kB',
    },
    {
        name: 'Mixed modules B',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        srcLimit: '307 kB',
        distLimit: '307 kB',
    },
    {
        name: 'Mixed modules C',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        srcLimit: '317 kB',
        distLimit: '317 kB',
    },
    {
        name: 'Mixed modules D',
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
        srcLimit: '321 kB',
        distLimit: '321 kB',
    },
    {
        name: 'Mixed modules E',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        srcLimit: '338 kB',
        distLimit: '338 kB',
    },
];

module.exports = scenarios.flatMap(({ name, import: imp, srcLimit, distLimit }) => [
    {
        name: `[src] ${name}`,
        import: imp,
        limit: srcLimit,
        path: './src/main.ts',
        modifyEsbuildConfig(config) {
            config.plugins = plugins;
            return config;
        },
    },
    {
        name: `[dist] ${name}`,
        import: imp,
        limit: distLimit,
        path: './dist/package/main.esm.mjs',
        modifyEsbuildConfig(config) {
            config.plugins = plugins;
            return config;
        },
    },
]);
