import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

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
    axes: [
        {
            type: 'angle-category',
            shape: 'circle',
            crossLines: [
                {
                    type: 'range',
                    range: ['Technical Skills', 'Communication'],
                    label: {
                        text: 'Valuable Skills',
                    },
                },
            ],
        },
        {
            type: 'radius-number',
            shape: 'circle',
            crossLines: [
                {
                    type: 'line',
                    value: 6,
                    stroke: 'red',
                    label: {
                        text: 'Minimal\nRequirement',
                        positionAngle: 180,
                    },
                },
            ],
        },
    ],
};

const chart = AgCharts.create(options);
