import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getBoxPlotData, getOutliersData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'HR Analytics',
    },
    subtitle: {
        text: 'Salary Distribution by Role',
    },
    series: [
        {
            data: getBoxPlotData(),
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
        },
        {
            data: getOutliersData(),
            type: 'scatter',
            xKey: 'role',
            xName: 'Role',
            yKey: 'salary',
            yName: 'Data Outliers',
        },
    ],
};

AgEnterpriseCharts.create(options);
