import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            secondaryLabelKey: 'size',
            sizeKey: 'size',
            secondaryLabel: {
                formatter: ({ value }) => (value != null ? `${value?.toFixed(0)} kb` : undefined),
            },
            tooltip: {
                renderer: ({ datum }) => ({
                    content: datum.size != null ? `Size: ${datum.size?.toFixed(0)} kb` : undefined,
                }),
            },
        },
    ],
    title: {
        text: 'Webpack dependencies',
    },
};

AgCharts.create(options);
