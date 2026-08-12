import { AgCartesianChartOptions, AgCharts, AgNumberAxisOptions } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'revenue',
        },
    ],
    axes: {
        x: {
            type: 'category',
        },
        y: {
            type: 'number',
            position: 'right',
            // Right-align the labels of this axis, rather than using the alignment
            // derived from the axis position.
            label: {
                textAlign: 'right',
                formatter: ({ value }) => `$${value.toLocaleString()}`,
            },
        } as AgNumberAxisOptions,
    },
};

AgCharts.create(options);
