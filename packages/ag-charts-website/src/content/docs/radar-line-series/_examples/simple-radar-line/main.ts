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
            type: 'radar-line',
            angleKey: 'subject',
            radiusKey: 'mike',
            radiusName: `Mike's Grades`,
        },
        {
            type: 'radar-line',
            angleKey: 'subject',
            radiusKey: 'tony',
            radiusName: `Tony's Grades`,
        },
    ],
};

AgEnterpriseCharts.create(options);
