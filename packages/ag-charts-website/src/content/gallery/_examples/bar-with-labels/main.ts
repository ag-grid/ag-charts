import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Change in Number of Jobs',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'job',
            yKey: 'change',
            label: {
                formatter: (params) => {
                    return (params.value > 0 ? '+' : '') + params.value;
                },
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            title: {
                enabled: true,
                text: 'Change / Thousands',
            },
        },
    ],
};

AgCharts.create(options);
