import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Night & Gale Inc revenue by product category`,
    },
    subtitle: {
        text: 'in million U.S. dollars',
    },
    series: [
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'Mountain air',
            stacked: true,
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'Polar winds',
            stacked: true,
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'Donut holes',
            stacked: true,
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);
