import {
    AgChartClickEvent,
    AgChartDoubleClickEvent,
    AgChartOptions,
    AgCharts,
} from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Number of Cars Sold',
    },
    subtitle: {
        text: '(single or double click empty space outside bars)',
    },
    data: [
        { month: 'March', units: 25, brands: { BMW: 10, Toyota: 15 } },
        { month: 'April', units: 27, brands: { Ford: 17, BMW: 10 } },
        { month: 'May', units: 42, brands: { Nissan: 20, Toyota: 22 } },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'units',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    listeners: {
        click: (_event: AgChartClickEvent) => {
            console.log('[click]');
        },
        doubleClick: (_event: AgChartDoubleClickEvent) => {
            console.log('[double click]');
        },
    },
};

AgCharts.create(options);
