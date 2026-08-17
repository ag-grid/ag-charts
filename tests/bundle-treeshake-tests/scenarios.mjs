// Bundle tree-shake test scenarios.
// Each scenario defines an import pattern and a gzip size limit (bytes).
// Limits are established via `run.sh -u` and should not be edited manually.

export const scenarios = [
    // === ag-charts-community ===
    {
        name: 'community/full',
        package: 'ag-charts-community',
        import: '*',
        limit: 416_000,
    },
    {
        name: 'community/CartesianChartModule',
        package: 'ag-charts-community',
        import: '{ CartesianChartModule }',
        limit: 402_000,
    },
    {
        name: 'community/PolarChartModule',
        package: 'ag-charts-community',
        import: '{ PolarChartModule }',
        limit: 403_000,
    },

    // === ag-charts-enterprise ===
    {
        name: 'enterprise/full',
        package: 'ag-charts-enterprise',
        import: '*',
        limit: 684_000,
    },
    {
        name: 'enterprise/AllCartesianModule',
        package: 'ag-charts-enterprise',
        import: '{ AllCartesianModule }',
        limit: 614_000,
    },
    {
        name: 'enterprise/AllPolarModule',
        package: 'ag-charts-enterprise',
        import: '{ AllPolarModule }',
        limit: 564_000,
    },
    {
        name: 'enterprise/AllMapSeriesModule',
        package: 'ag-charts-enterprise',
        import: '{ AllMapSeriesModule }',
        limit: 571_000,
    },
    {
        name: 'enterprise/AllEnterpriseModule',
        package: 'ag-charts-enterprise',
        import: '{ AllEnterpriseModule }',
        limit: 679_000,
    },
    {
        name: 'enterprise/BoxPlotSeriesModule',
        package: 'ag-charts-enterprise',
        import: '{ BoxPlotSeriesModule }',
        limit: 578_000,
    },
    {
        name: 'enterprise/MixedA',
        package: 'ag-charts-enterprise',
        import: '{ BoxPlotSeriesModule, NavigatorModule }',
        limit: 558_000,
    },
    {
        name: 'enterprise/MixedB',
        package: 'ag-charts-enterprise',
        import: '{ AngleNumberAxisModule, RadialBarSeriesModule, StatusBarModule }',
        limit: 581_000,
    },
    {
        name: 'enterprise/MixedC',
        package: 'ag-charts-enterprise',
        import: '{ FunnelSeriesModule, MapLineSeriesModule, CrosshairModule, GradientLegendModule }',
        limit: 537_000,
    },
    {
        name: 'enterprise/MixedD',
        package: 'ag-charts-enterprise',
        import: '{ HeatmapSeriesModule, LinearGaugeModule, DataSourceModule, ContextMenuModule, AnimationModule }',
        limit: 571_000,
    },
    {
        name: 'enterprise/MixedE',
        package: 'ag-charts-enterprise',
        import: '{ RadarLineSeriesModule, MapMarkerSeriesModule, RangeAreaSeriesModule, BandHighlightModule, SyncModule, ZoomModule }',
        limit: 581_000,
    },
];
