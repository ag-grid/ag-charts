const { plugins } = require('../../esbuild.config.cjs');

const scenarios = [
    {
        name: 'Full package',
        import: '*',
        srcLimit: '519 kB',
        distLimit: '520 kB',
    },
    {
        name: 'BoxPlot module only',
        import: '{ BoxPlotSeriesModule }',
        srcLimit: '282 kB',
        distLimit: '383 kB',
    },
    {
        name: 'Mixed modules A',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        srcLimit: '338 kB',
        distLimit: '411 kB',
    },
    {
        name: 'Mixed modules B',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        srcLimit: '284 kB',
        distLimit: '385 kB',
    },
    {
        name: 'Mixed modules C',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        srcLimit: '292 kB',
        distLimit: '391 kB',
    },
    {
        name: 'Mixed modules D',
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
        srcLimit: '296 kB',
        distLimit: '396 kB',
    },
    {
        name: 'Mixed modules E',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        srcLimit: '314 kB',
        distLimit: '403 kB',
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
