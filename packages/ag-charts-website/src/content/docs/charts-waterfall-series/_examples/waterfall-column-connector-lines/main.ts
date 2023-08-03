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
            type: 'waterfall-column',
            xKey: 'source',
            xName: 'Source',
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
