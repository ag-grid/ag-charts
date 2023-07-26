import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Waterfall Column',
    },
    series: [
        {
            type: 'waterfall-column',
            xKey: 'date',
            xName: 'Date',
            yKey: 'amount',
            typeKey: 'datumType',
            yName: 'Amount',
        },
    ],
};

AgEnterpriseCharts.create(options);
