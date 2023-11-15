import { AgChart, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Internet Users by Geographical Location',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'area',
            yKey: 'usedInLast3Months',
            yName: 'Used in last 3 months',
            normalizedTo: 1,
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'area',
            yKey: 'usedOver3MonthsAgo',
            yName: 'Used over 3 months ago',
            normalizedTo: 1,
            stacked: true,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'area',
            yKey: 'neverUsed',
            yName: 'Never used',
            normalizedTo: 1,
            stacked: true,
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
            label: {
                format: '.0%',
            },
        },
    ],
};

AgChart.create(options);
