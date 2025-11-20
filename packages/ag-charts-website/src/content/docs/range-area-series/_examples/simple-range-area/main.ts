import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { NumberAxisModule, ModuleRegistry, UnitTimeAxisModule } from 'ag-charts-community';
import { RangeAreaSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([NumberAxisModule, RangeAreaSeriesModule, UnitTimeAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'London Property Average Price Range',
    },
    subtitle: {
        text: '2000 - 2020',
    },
    series: [
        {
            type: 'range-area',
            xKey: 'date',
            yLowKey: 'flatsAndMaisonettes',
            yHighKey: 'detachedHouses',
        },
    ],
    axes: {
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Average Price',
            },
            label: {
                formatter: ({ value }) => `£${Number(value).toLocaleString()}`,
            },
        },
        x: {
            position: 'bottom',
            type: 'unit-time',
        },
    },
};

AgCharts.create(options);
