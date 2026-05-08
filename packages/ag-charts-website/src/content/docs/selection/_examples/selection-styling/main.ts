import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    SelectionModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule, SelectionModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Quarterly Revenue' },
    selection: {
        enabled: true,
        enableDrag: true,
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'revenue',
            yName: 'Revenue ($m)',
            highlight: { enabled: false },
            selection: {
                selectedItem: {
                    fill: '#c0392b',
                    stroke: '#922b21',
                    strokeWidth: 3,
                },
                unselectedItem: {
                    fill: '#bdc3c7',
                    fillOpacity: 0.6,
                },
            },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
};

AgCharts.create(options);
