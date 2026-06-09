const { plugins } = require('../../esbuild.config.cjs');

const scenarios = [
    {
        name: 'Full package',
        import: '*',
        srcLimit: '484 kB',
        distLimit: '485 kB',
    },
    {
        name: 'BoxPlot module only',
        import: '{ BoxPlotSeriesModule }',
        srcLimit: '261 kB',
        distLimit: '377 kB',
    },
    {
        name: 'Mixed modules A',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        srcLimit: '309 kB',
        distLimit: '401 kB',
    },
    {
        name: 'Mixed modules B',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        srcLimit: '264 kB',
        distLimit: '378 kB',
    },
    {
        name: 'Mixed modules C',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        srcLimit: '271 kB',
        distLimit: '385 kB',
    },
    {
        name: 'Mixed modules D',
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
        srcLimit: '273 kB',
        distLimit: '384 kB',
    },
    {
        name: 'Mixed modules E',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        srcLimit: '292 kB',
        distLimit: '397 kB',
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
