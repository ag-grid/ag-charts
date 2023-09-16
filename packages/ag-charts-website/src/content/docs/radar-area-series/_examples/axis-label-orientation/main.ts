import { AgEnterpriseCharts, AgPolarChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgPolarChartOptions = {
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
            label: {
                orientation: 'parallel',
            },
        },
        {
            type: 'radius-number',
        },
    ],
};

AgEnterpriseCharts.create(options);
