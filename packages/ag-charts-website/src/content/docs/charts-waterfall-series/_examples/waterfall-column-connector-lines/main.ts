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
            yName: 'Amount',
            line: {
                strokeWidth: 4,
                stroke: '#7290C4',
                lineDash: [4, 2],
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
