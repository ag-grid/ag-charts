// Each scenario is a consumer entry point; every named import is referenced so the bundler keeps it.
// `'*'` imports the whole package namespace.
export const scenarios = [
    { name: 'community: AgCharts only', imports: { 'ag-charts-community': ['AgCharts', 'ModuleRegistry'] } },
    {
        name: 'community: line chart',
        imports: {
            'ag-charts-community': [
                'AgCharts',
                'ModuleRegistry',
                'LineSeriesModule',
                'NumberAxisModule',
                'CategoryAxisModule',
            ],
        },
    },
    {
        name: 'community: bar chart',
        imports: {
            'ag-charts-community': [
                'AgCharts',
                'ModuleRegistry',
                'BarSeriesModule',
                'NumberAxisModule',
                'CategoryAxisModule',
            ],
        },
    },
    {
        name: 'community: pie chart',
        imports: { 'ag-charts-community': ['AgCharts', 'ModuleRegistry', 'PieSeriesModule'] },
    },
    {
        name: 'community: AllCommunityModule',
        imports: { 'ag-charts-community': ['AgCharts', 'ModuleRegistry', 'AllCommunityModule'] },
    },
    { name: 'community: full package', imports: { 'ag-charts-community': '*' } },
    { name: 'enterprise: AgCharts only', imports: { 'ag-charts-enterprise': ['AgCharts', 'ModuleRegistry'] } },
    {
        name: 'enterprise: line + zoom + navigator',
        imports: {
            'ag-charts-enterprise': [
                'AgCharts',
                'ModuleRegistry',
                'LineSeriesModule',
                'NumberAxisModule',
                'CategoryAxisModule',
                'ZoomModule',
                'NavigatorModule',
            ],
        },
    },
    {
        name: 'enterprise: box plot',
        imports: {
            'ag-charts-enterprise': [
                'AgCharts',
                'ModuleRegistry',
                'BoxPlotSeriesModule',
                'NumberAxisModule',
                'CategoryAxisModule',
            ],
        },
    },
    {
        name: 'enterprise: AllEnterpriseModule',
        imports: { 'ag-charts-enterprise': ['AgCharts', 'ModuleRegistry', 'AllEnterpriseModule'] },
    },
    { name: 'enterprise: full package', imports: { 'ag-charts-enterprise': '*' } },
    { name: 'core: full package', imports: { 'ag-charts-core': '*' } },
];
