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
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'Polar winds',
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'Donut holes',
        },
    ],
    axes: [
        {
            type: 'angle-category',
            shape: 'circle',
            groupPaddingInner: 0.2,
            groupPaddingOuter: 0.2,
        },
        {
            type: 'radius-number',
            shape: 'circle',
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);
