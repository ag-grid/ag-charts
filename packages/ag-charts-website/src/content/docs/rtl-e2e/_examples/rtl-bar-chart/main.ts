import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AnimationModule, BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    enableRtl: true,
    title: {
        text: 'תרשים עמודות',
    },
    subtitle: {
        text: 'מכירות Sales מוצרים',
    },
    footnote: {
        text: 'Sales in שקלים for 2024',
    },
    data: [
        { month: 'ינואר', sales: 150, revenue: 200 },
        { month: 'פברואר', sales: 230, revenue: 310 },
        { month: 'מרץ', sales: 180, revenue: 250 },
        { month: 'אפריל', sales: 290, revenue: 380 },
        { month: 'מאי', sales: 210, revenue: 290 },
        { month: 'יוני', sales: 260, revenue: 350 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sales',
            yName: 'Revenue מכירות',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'revenue',
            yName: 'מכירות Q1 2024',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'right',
            title: {
                text: 'מכירות Q1 2024',
            },
        },
    },
};

AgCharts.create(options);
