// Bundle render test scenarios.
// Each scenario defines modules to register and chart options to verify that a
// tree-shaken bundle produces a functional chart.
//
// Unlike the size-limit scenarios (which test bundle size alone), these scenarios
// include all modules needed for a functional chart (axes, series, chart type).

const barData = [
    { category: 'Q1', value: 10 },
    { category: 'Q2', value: 25 },
    { category: 'Q3', value: 15 },
    { category: 'Q4', value: 30 },
];

const pieData = [
    { label: 'A', value: 30 },
    { label: 'B', value: 50 },
    { label: 'C', value: 20 },
];

const boxPlotData = [
    { category: 'A', min: 1, q1: 3, median: 5, q3: 7, max: 9 },
    { category: 'B', min: 2, q1: 4, median: 6, q3: 8, max: 10 },
    { category: 'C', min: 0, q1: 2, median: 4, q3: 6, max: 8 },
];

const radialBarData = [
    { category: 'Mon', value: 5 },
    { category: 'Tue', value: 8 },
    { category: 'Wed', value: 3 },
    { category: 'Thu', value: 7 },
];

const funnelData = [
    { stage: 'Leads', count: 1000 },
    { stage: 'Qualified', count: 600 },
    { stage: 'Proposals', count: 300 },
    { stage: 'Won', count: 100 },
];

const heatmapData = [
    { x: 'A', y: '1', value: 10 },
    { x: 'A', y: '2', value: 20 },
    { x: 'B', y: '1', value: 30 },
    { x: 'B', y: '2', value: 40 },
];

const rangeAreaData = [
    { category: 'Q1', low: 5, high: 15 },
    { category: 'Q2', low: 10, high: 30 },
    { category: 'Q3', low: 8, high: 20 },
    { category: 'Q4', low: 12, high: 35 },
];

export const scenarios = [
    // === ag-charts-community ===
    {
        name: 'community/full',
        package: 'ag-charts-community',
        modules: ['AllCommunityModule'],
        chartOptions: {
            data: barData,
            series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
        },
    },
    {
        name: 'community/CartesianChartModule',
        package: 'ag-charts-community',
        modules: ['CartesianChartModule', 'BarSeriesModule', 'NumberAxisModule', 'CategoryAxisModule'],
        chartOptions: {
            data: barData,
            series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
        },
    },
    {
        name: 'community/PolarChartModule',
        package: 'ag-charts-community',
        modules: ['PolarChartModule', 'PieSeriesModule', 'LegendModule'],
        chartOptions: {
            data: pieData,
            series: [{ type: 'pie', angleKey: 'value', legendItemKey: 'label' }],
        },
    },

    // === ag-charts-enterprise ===
    {
        name: 'enterprise/full',
        package: 'ag-charts-enterprise',
        modules: ['AllEnterpriseModule'],
        chartOptions: {
            data: barData,
            series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
        },
    },
    {
        name: 'enterprise/BoxPlotSeriesModule',
        package: 'ag-charts-enterprise',
        modules: ['BoxPlotSeriesModule', 'NumberAxisModule', 'CategoryAxisModule'],
        chartOptions: {
            data: boxPlotData,
            series: [
                {
                    type: 'box-plot',
                    xKey: 'category',
                    minKey: 'min',
                    q1Key: 'q1',
                    medianKey: 'median',
                    q3Key: 'q3',
                    maxKey: 'max',
                },
            ],
        },
    },
    {
        name: 'enterprise/MixedA',
        package: 'ag-charts-enterprise',
        modules: ['BoxPlotSeriesModule', 'NavigatorModule', 'NumberAxisModule', 'CategoryAxisModule'],
        chartOptions: {
            data: boxPlotData,
            series: [
                {
                    type: 'box-plot',
                    xKey: 'category',
                    minKey: 'min',
                    q1Key: 'q1',
                    medianKey: 'median',
                    q3Key: 'q3',
                    maxKey: 'max',
                },
            ],
        },
    },
    {
        name: 'enterprise/MixedB',
        package: 'ag-charts-enterprise',
        modules: ['AngleNumberAxisModule', 'RadiusCategoryAxisModule', 'RadialBarSeriesModule', 'StatusBarModule'],
        chartOptions: {
            data: radialBarData,
            series: [{ type: 'radial-bar', angleKey: 'value', radiusKey: 'category' }],
        },
    },
    {
        name: 'enterprise/MixedC',
        package: 'ag-charts-enterprise',
        modules: [
            'FunnelSeriesModule',
            'MapLineSeriesModule',
            'CrosshairModule',
            'GradientLegendModule',
            'NumberAxisModule',
            'CategoryAxisModule',
        ],
        chartOptions: {
            data: funnelData,
            series: [{ type: 'funnel', stageKey: 'stage', valueKey: 'count' }],
        },
    },
    {
        name: 'enterprise/MixedD',
        package: 'ag-charts-enterprise',
        modules: [
            'HeatmapSeriesModule',
            'LinearGaugeModule',
            'DataSourceModule',
            'ContextMenuModule',
            'AnimationModule',
            'GradientLegendModule',
            'NumberAxisModule',
            'CategoryAxisModule',
        ],
        chartOptions: {
            data: heatmapData,
            series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'value', colorRange: ['#c7e9c0', '#00441b'] }],
        },
    },
    {
        name: 'enterprise/MixedE',
        package: 'ag-charts-enterprise',
        modules: [
            'RadarLineSeriesModule',
            'MapMarkerSeriesModule',
            'RangeAreaSeriesModule',
            'BandHighlightModule',
            'SyncModule',
            'ZoomModule',
            'NumberAxisModule',
            'CategoryAxisModule',
        ],
        chartOptions: {
            data: rangeAreaData,
            series: [{ type: 'range-area', xKey: 'category', yLowKey: 'low', yHighKey: 'high' }],
        },
    },
];
