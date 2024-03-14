import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

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
            direction: 'horizontal',
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
            strokeWidth: 1,
            cornerRadius: 3,
        },
    ],
    axes: [
        {
            position: 'left',
            type: 'category',
            groupPaddingInner: 0,
            paddingInner: 0.7,
            paddingOuter: 0.2,
            gridLine: {
                enabled: true,
            },
            line: {
                enabled: false,
            },
            label: {
                padding: 10,
            },
        },
        {
            position: 'bottom',
            type: 'number',
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
        },
    ],
};
AgCharts.create(options);
