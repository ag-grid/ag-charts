import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'HR Analytics',
    },
    subtitle: {
        text: 'Salary Distribution by Role',
    },
    data: getData(),
    series: [
        {
            type: 'box-plot',
            yName: 'Employee Salaries',
            xKey: 'role',
            xName: 'Role',
            minKey: 'min',
            minName: 'Min',
            q1Key: 'q1',
            q1Name: 'Q1',
            medianKey: 'median',
            medianName: 'Median',
            q3Key: 'q3',
            q3Name: 'Q3',
            maxKey: 'max',
            maxName: 'Max',
            fill: '#7fc3c3',
            stroke: '#098a89',
            strokeWidth: 2,
            whisker: {
                stroke: '#098a89',
                strokeWidth: 3,
                lineDash: [2, 1],
            },
            cap: {
                lengthRatio: 0.8,
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
