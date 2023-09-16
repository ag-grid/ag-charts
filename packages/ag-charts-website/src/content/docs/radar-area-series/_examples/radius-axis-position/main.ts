import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'School Grades',
    },
    series: [
        {
            type: 'radar-area',
            angleKey: 'subject',
            radiusKey: 'mike',
            radiusName: `Mike's grades`,
        },
        {
            type: 'radar-area',
            angleKey: 'subject',
            radiusKey: 'tony',
            radiusName: `Tony's grades`,
        },
    ],
    axes: [
        {
            type: 'angle-category',
        },
        {
            type: 'radius-number',
            positionAngle: 360 / 5,
            label: {
                rotation: -360 / 5,
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
