import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Gross Weekly Earnings',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'type',
            yKey: 'earnings',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            title: {
                enabled: true,
                text: '£ / Week',
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
