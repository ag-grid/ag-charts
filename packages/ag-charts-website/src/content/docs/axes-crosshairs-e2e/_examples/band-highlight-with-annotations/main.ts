import type { AgChartOptions } from 'ag-charts-enterprise';
import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Sales Revenue',
    },
    footnote: {
        text: '2024, values in $1000s',
    },
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'revenue',
            interpolation: { type: 'smooth' },
            marker: {
                enabled: false,
            },
            label: {
                enabled: true,
            },
        },
    ],
    annotations: {
        enabled: true,
    },
    axes: {
        y: {
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
        x: {
            bandHighlight: {
                enabled: true,
            },
        },
    },
};

AgCharts.create(options);
