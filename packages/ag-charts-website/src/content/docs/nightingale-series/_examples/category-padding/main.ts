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
            radiusKey: 'air',
            radiusName: 'Mountain air',
            grouped: true,
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'winds',
            radiusName: 'Polar winds',
            grouped: true,
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'holes',
            radiusName: 'Donut holes',
            grouped: true,
        },
    ],
    axes: [
        {
            type: 'angle-category',
            groupPaddingInner: 0.25,
            paddingInner: 0.25,
        },
        {
            type: 'radius-number',
        },
    ],
};

AgEnterpriseCharts.create(options);
