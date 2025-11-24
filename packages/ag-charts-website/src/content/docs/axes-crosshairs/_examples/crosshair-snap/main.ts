import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, CrosshairModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule, CrosshairModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `United Kingdom Population`,
    },
    series: [
        {
            type: 'line',
            yKey: 'population',
            xKey: 'year',
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'left',
            crosshair: {
                snap: false,
            },
        },
        x: {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Year',
            },
            crosshair: {
                snap: false,
            },
        },
    },
    tooltip: {
        enabled: false,
    },
    formatter: {
        y: ({ value }) => {
            return `${Number(value).toLocaleString('en-GB', {
                notation: 'compact',
                maximumFractionDigits: 1,
            })}`;
        },
    },
};

AgCharts.create(options);
