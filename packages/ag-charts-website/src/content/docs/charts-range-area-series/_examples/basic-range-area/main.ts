import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Range Area',
    },
    series: [
        {
            type: 'range-area',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
        } as any,
    ],
};

AgEnterpriseCharts.create(options);
