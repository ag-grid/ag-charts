import { AgCartesianChartOptions, AgCategoryAxisOptions, AgCharts } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'region',
            yKey: 'revenue',
        },
    ],
    axes: {
        x: {
            type: 'category',
            label: {
                // Region names of differing lengths wrap onto a differing number of lines. Flush
                // the bottom of every label to a common line, rather than leaving each one
                // anchored around its own centre.
                wrapping: 'always',
                verticalAlign: 'bottom',
            },
        } as AgCategoryAxisOptions,
        y: {
            type: 'number',
            label: {
                formatter: ({ value }) => `$${value.toLocaleString()}`,
            },
        },
    },
};

AgCharts.create(options);
