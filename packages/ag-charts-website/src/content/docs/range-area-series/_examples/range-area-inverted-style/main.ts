import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { RangeAreaSeriesModule } from 'ag-charts-enterprise';

import { DataType, data } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, NumberAxisModule, RangeAreaSeriesModule]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Performance: Projected vs Actual' },
    subtitle: { text: 'Red fill highlights quarters where actual performance fell below projections' },
    data,
    series: [
        {
            type: 'range-area',
            xKey: 'quarter',
            yLowKey: 'projected',
            yHighKey: 'actual',
            yLowName: 'Projected',
            yHighName: 'Actual',
            invertedStyle: {
                fill: 'red',
            },
            interpolation: {
                type: 'smooth',
            },
        },
    ],
};

AgCharts.create(options);
