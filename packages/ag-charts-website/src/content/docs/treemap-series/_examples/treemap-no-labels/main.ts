import { AgChartOptions, AgCharts, ModuleRegistry, TreemapSeriesModule } from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([TreemapSeriesModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'title',
            sizeKey: 'total',
            tile: {
                label: { enabled: false },
                secondaryLabel: { enabled: false },
            },
            group: {
                label: { enabled: false },
            },
        },
    ],
    legend: { enabled: false },
};

AgCharts.create(options);
