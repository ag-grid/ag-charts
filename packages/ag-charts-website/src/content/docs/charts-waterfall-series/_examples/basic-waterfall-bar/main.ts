import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK Govornment Budget',
    },
    subtitle: {
        text: 'All values in £bns',
    },
    series: [
        {
            type: 'waterfall-bar',
            xKey: 'source',
            xName: 'Source',
            yKey: 'amount',
            yName: 'Amount',
        },
    ],
};

AgEnterpriseCharts.create(options);
