import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getBoxPlotData, getOutliersData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'IBM HR Analytics',
    },
    subtitle: {
        text: 'Employee Salaries Distribution by Role',
    },
    series: [
        {
            data: getBoxPlotData(),
            type: 'box-plot',
            yName: 'Employee Salaries',
            xKey: 'role',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
        },
        {
            data: getOutliersData(),
            type: 'scatter',
            xKey: 'salary',
            yKey: 'role',
            yName: 'Data Outliers',
        },
    ],
};

console.log(getOutliersData());

AgEnterpriseCharts.create(options);
