import { AgChart, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Skill Analysis',
    },
    series: [
        {
            type: 'radar-line',
            angleKey: 'skill',
            radiusKey: 'value',
        },
    ],
    legend: {
        enabled: true,
    },
    axes: [
        {
            type: 'angle-category',
            shape: 'circle',
            crossLines: [
                {
                    type: 'line',
                    value: 'Meeting Deadlines',
                    label: {
                        text: 'Useless Skill',
                    },
                },
                {
                    type: 'range',
                    range: ['Communication', 'Team Player'],
                    label: {
                        text: 'Valuable Skills',
                    },
                },
            ],
        },
        {
            type: 'radius-number',
            shape: 'circle',
        },
    ],
};

const chart = AgChart.create(options);
