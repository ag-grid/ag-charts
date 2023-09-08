import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
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
        },
        {
            type: 'radius-number',
            shape: 'circle',
            crossLines: [
                {
                    type: 'line',
                    value: 4,
                    label: {
                        text: 'Minimal\nRequirement',
                        positionAngle: 210,
                    },
                },
                {
                    type: 'range',
                    range: [7, 10],
                    label: {
                        text: 'Excellent',
                        positionAngle: 150,
                    },
                },
            ],
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);
