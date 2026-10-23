// Bundle tree-shake test scenarios.
// Each scenario defines either an import pattern (re-exported symbols) or a `register` list (a chart
// entry point registering those modules), and a gzip size limit (bytes).
// Limits are established via `run.sh -u` and should not be edited manually.

export const scenarios = [
    // === ag-charts-community: minimal charts ===
    {
        name: 'community/chart/floor',
        package: 'ag-charts-community',
        register: [],
        limit: 261_000,
    },
    {
        name: 'community/chart/sparkline',
        package: 'ag-charts-community',
        register: ['SparklinePresetModule', 'LineSeriesModule', 'CategoryAxisModule', 'NumberAxisModule'],
        limit: 355_000,
    },
    {
        name: 'community/chart/line',
        package: 'ag-charts-community',
        register: ['LineSeriesModule', 'CategoryAxisModule', 'NumberAxisModule'],
        limit: 353_000,
    },
    {
        name: 'community/chart/pie',
        package: 'ag-charts-community',
        register: ['PieSeriesModule'],
        limit: 314_000,
    },

    // === ag-charts-community ===
    {
        name: 'community/full',
        package: 'ag-charts-community',
        import: '*',
        limit: 467_000,
    },
    {
        name: 'community/CartesianChartModule',
        package: 'ag-charts-community',
        import: '{ CartesianChartModule }',
        limit: 276_000,
    },
    {
        name: 'community/PolarChartModule',
        package: 'ag-charts-community',
        import: '{ PolarChartModule }',
        limit: 233_000,
    },

    // === ag-charts-enterprise: minimal charts ===
    {
        name: 'enterprise/chart/floor',
        package: 'ag-charts-enterprise',
        register: [],
        limit: 377_000,
    },

    // === ag-charts-enterprise ===
    {
        name: 'enterprise/full',
        package: 'ag-charts-enterprise',
        import: '*',
        limit: 803_000,
    },
    {
        name: 'enterprise/AllCartesianModule',
        package: 'ag-charts-enterprise',
        import: '{ AllCartesianModule }',
        limit: 623_000,
    },
    {
        name: 'enterprise/AllPolarModule',
        package: 'ag-charts-enterprise',
        import: '{ AllPolarModule }',
        limit: 463_000,
    },
    {
        name: 'enterprise/AllMapSeriesModule',
        package: 'ag-charts-enterprise',
        import: '{ AllMapSeriesModule }',
        limit: 402_000,
    },
    {
        name: 'enterprise/AllEnterpriseModule',
        package: 'ag-charts-enterprise',
        import: '{ AllEnterpriseModule }',
        limit: 796_000,
    },
    {
        name: 'enterprise/BoxPlotSeriesModule',
        package: 'ag-charts-enterprise',
        import: '{ BoxPlotSeriesModule }',
        limit: 391_000,
    },
    {
        name: 'enterprise/MixedA',
        package: 'ag-charts-enterprise',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        limit: 500_000,
    },
    {
        name: 'enterprise/MixedB',
        package: 'ag-charts-enterprise',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        limit: 395_000,
    },
    {
        name: 'enterprise/MixedC',
        package: 'ag-charts-enterprise',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        limit: 410_000,
    },
    {
        name: 'enterprise/MixedD',
        package: 'ag-charts-enterprise',
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
        limit: 418_000,
    },
    {
        name: 'enterprise/MixedE',
        package: 'ag-charts-enterprise',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        limit: 440_000,
    },
];
