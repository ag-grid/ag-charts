import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue Open by Sales Stage',
    },
    series: [
        {
            type: 'funnel',
            stageKey: 'group',
            valueKey: 'value',
            direction: 'vertical',
            dropOff: {
                enabled: false,
            },
            label: {
                formatter({ value }) {
                    return numberFormatter.format(value);
                },
            },
        },
    ],
};

AgCharts.create(options);
