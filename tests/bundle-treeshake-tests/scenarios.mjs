// Bundle tree-shake test scenarios.
// Each scenario defines an import pattern and a gzip size limit (bytes).
// Limits are established via `run.sh -u` and should not be edited manually.

export const scenarios = [
    // === ag-charts-community ===
    {
        name: 'community/full',
        package: 'ag-charts-community',
        import: '*',
        limit: 435_000,
    },
    {
        name: 'community/CartesianChartModule',
        package: 'ag-charts-community',
        import: '{ CartesianChartModule }',
        limit: 411_000,
    },
    {
        name: 'community/PolarChartModule',
        package: 'ag-charts-community',
        import: '{ PolarChartModule }',
        limit: 413_000,
    },

    // === ag-charts-enterprise ===
    {
        name: 'enterprise/full',
        package: 'ag-charts-enterprise',
        import: '*',
        limit: 719_000,
    },
    {
        name: 'enterprise/AllCartesianModule',
        package: 'ag-charts-enterprise',
        import: '{ AllCartesianModule }',
        limit: 624_000,
    },
    {
        name: 'enterprise/AllPolarModule',
        package: 'ag-charts-enterprise',
        import: '{ AllPolarModule }',
        limit: 593_000,
    },
    {
        name: 'enterprise/AllMapSeriesModule',
        package: 'ag-charts-enterprise',
        import: '{ AllMapSeriesModule }',
        limit: 585_000,
    },
    {
        name: 'enterprise/AllEnterpriseModule',
        package: 'ag-charts-enterprise',
        import: '{ AllEnterpriseModule }',
        limit: 712_000,
    },
    {
        name: 'enterprise/BoxPlotSeriesModule',
        package: 'ag-charts-enterprise',
        import: '{ BoxPlotSeriesModule }',
        limit: 568_000,
    },
    {
        name: 'enterprise/MixedA',
        package: 'ag-charts-enterprise',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        limit: 574_000,
    },
    {
        name: 'enterprise/MixedB',
        package: 'ag-charts-enterprise',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        limit: 569_000,
    },
    {
        name: 'enterprise/MixedC',
        package: 'ag-charts-enterprise',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        limit: 577_000,
    },
    {
        name: 'enterprise/MixedD',
        package: 'ag-charts-enterprise',
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
        limit: 587_000,
    },
    {
        name: 'enterprise/MixedE',
        package: 'ag-charts-enterprise',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        limit: 596_000,
    },
];
