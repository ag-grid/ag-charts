import { AgEnterpriseCharts, AgPolarChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'KPIs by Department',
    },
    series: [
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'employeeRetention',
            radiusName: 'Employee Retention',
        },
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
        },
    ],
    axes: [
        {
            type: 'angle-category',
            shape: 'circle',
        },
        {
            type: 'radius-number',
            shape: 'circle',
        },
    ]
};

AgEnterpriseCharts.create(options);
