import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Conversion Drop Off',
    },
    series: [
        {
            type: 'funnel',
            stageKey: 'group',
            valueKey: 'value',
            spacingRatio: 0.3,
            stageLabel: {
                enabled: false,
            },
            label: {
                formatter({ value }) {
                    return value.toLocaleString();
                },
            },
        },
    ],
};

AgCharts.create(options);
