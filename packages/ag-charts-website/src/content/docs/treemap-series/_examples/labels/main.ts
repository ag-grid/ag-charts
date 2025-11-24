import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { TreemapSeriesModule } from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, NumberAxisModule, TreemapSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'treemap',
            labelKey: 'title',
            secondaryLabelKey: 'total',
            sizeKey: 'total',
            sizeName: 'Total',
            group: {
                label: {
                    fontSize: 18,
                    spacing: 2,
                },
            },
            tile: {
                label: {
                    fontSize: 24,
                    minimumFontSize: 9,
                    spacing: 8,
                },
                secondaryLabel: {
                    formatter: (params) => `£${params.value.toFixed(1)}bn`,
                },
            },
        },
    ],
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: '2024',
    },
};

AgCharts.create(options);
