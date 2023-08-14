import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Average High and Low Temperatures',
    },
    subtitle: {
        text: 'London 2022-2023'
    },
    series: [
        {
            type: 'range-area',
            xKey: 'month',
            xName: 'Month',
            yLowKey: 'low',
            yHighKey: 'high',
        } as any,
    ],
};

AgEnterpriseCharts.create(options);
