import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'HR Analytics',
    },
    subtitle: {
        text: 'Salary Distribution by Department',
    },
    data: getData(),
    series: [
        {
            type: 'box-plot',
            direction: 'vertical',
            xKey: 'department',
            yName: 'Salary Range',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
        },
    ],
};

AgEnterpriseCharts.create(options);
