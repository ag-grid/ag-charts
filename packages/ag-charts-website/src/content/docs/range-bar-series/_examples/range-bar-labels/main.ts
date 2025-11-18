import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Salary Ranges By Department',
    },
    subtitle: {
        text: 'Low and High Salary Brackets Across Various Departments (in thousands)',
    },
    series: [
        {
            type: 'range-bar',
            xKey: 'department',
            yLowKey: 'low',
            yHighKey: 'high',
            label: {
                padding: 10,
                formatter: ({ itemType, value }) => {
                    return `£${value.toFixed(0)}K ${itemType === 'low' ? '↓' : '↑'}`;
                },
            },
        },
    ],
};

AgCharts.create(options);
