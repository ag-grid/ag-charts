import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, CrosshairModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    enableRtl: true,
    title: {
        text: 'רווח והפסד',
    },
    data: [
        { month: 'ינואר', profit: -45, change: -12.5 },
        { month: 'פברואר', profit: 30, change: 8 },
        { month: 'מרץ', profit: -20, change: -3.5 },
        { month: 'אפריל', profit: 60, change: 15 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'profit',
            yName: 'רווח',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'change',
            yName: 'שינוי',
            tooltip: {
                renderer: ({ datum }) => `<div class="custom-tooltip">שינוי: ${datum.change}%</div>`,
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            crosshair: { enabled: true, snap: false },
        },
        y: {
            type: 'number',
            position: 'left',
            crosshair: { enabled: true, snap: false },
        },
    },
};

AgCharts.create(options);
