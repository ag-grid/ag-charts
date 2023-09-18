import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'IBM HR Analytics',
    },
    subtitle: {
        text: 'Employee Salaries Distribution by Role',
    },
    data: getData(),
    series: [
        {
            // common props
            type: 'box-plot',
            yName: 'Job Role',
            xKey: 'role',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
            // styling props
            strokeWidth: 1,
            cap: {
                lengthRatio: 0.8,
            },
            whisker: {
                stroke: 'red',
                strokeWidth: 3,
                lineDash: [2, 1],
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
