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
        limit: 278_000,
    },
    {
        name: 'community/chart/sparkline',
        package: 'ag-charts-community',
        register: ['SparklinePresetModule', 'LineSeriesModule', 'CategoryAxisModule', 'NumberAxisModule'],
        limit: 372_000,
    },
    {
        name: 'community/chart/line',
        package: 'ag-charts-community',
        register: ['LineSeriesModule', 'CategoryAxisModule', 'NumberAxisModule'],
        limit: 370_000,
    },
    {
        name: 'community/chart/pie',
        package: 'ag-charts-community',
        register: ['PieSeriesModule'],
        limit: 330_000,
    },

    // === ag-charts-community ===
    {
        name: 'community/full',
        package: 'ag-charts-community',
        import: '*',
        limit: 492_000,
    },
    {
        name: 'community/CartesianChartModule',
        package: 'ag-charts-community',
        import: '{ CartesianChartModule }',
        limit: 113_000,
    },
    {
        name: 'community/PolarChartModule',
        package: 'ag-charts-community',
        import: '{ PolarChartModule }',
        limit: 94_000,
    },

    // === ag-charts-enterprise: minimal charts ===
    {
        name: 'enterprise/chart/floor',
        package: 'ag-charts-enterprise',
        register: [],
        limit: 390_000,
    },

    // === ag-charts-enterprise ===
    {
        name: 'enterprise/full',
        package: 'ag-charts-enterprise',
        import: '*',
        limit: 840_000,
    },
    {
        name: 'enterprise/AllEnterpriseModule',
        package: 'ag-charts-enterprise',
        import: '{ AllEnterpriseModule }',
        limit: 756_000,
    },
    {
        name: 'enterprise/BoxPlotSeriesModule',
        package: 'ag-charts-enterprise',
        import: '{ BoxPlotSeriesModule }',
        limit: 327_000,
    },
    {
        name: 'enterprise/MixedA',
        package: 'ag-charts-enterprise',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        limit: 438_000,
    },
    {
        name: 'enterprise/MixedB',
        package: 'ag-charts-enterprise',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        limit: 331_000,
    },
    {
        name: 'enterprise/MixedC',
        package: 'ag-charts-enterprise',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        limit: 347_000,
    },
    {
        name: 'enterprise/MixedD',
        package: 'ag-charts-enterprise',
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
        limit: 353_000,
    },
    {
        name: 'enterprise/MixedE',
        package: 'ag-charts-enterprise',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        limit: 377_000,
    },
];
