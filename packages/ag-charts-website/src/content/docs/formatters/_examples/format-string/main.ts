import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { LineSeriesModule, ModuleRegistry, NumberAxisModule, UnitTimeAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([LegendModule, LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'temp',
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'left',
        },
        x: {
            type: 'unit-time',
            position: 'bottom',
            interval: { step: 'month' },
        },
    },
    formatter: {
        x: '%b %Y',
        y: '$#{0>6.2f}',
    },
};

AgCharts.create(options);
