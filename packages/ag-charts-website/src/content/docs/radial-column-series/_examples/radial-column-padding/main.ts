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
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'air',
            radiusName: 'Mountain air',
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'winds',
            radiusName: 'Polar winds',
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'holes',
            radiusName: 'Donut holes',
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

const chart = AgEnterpriseCharts.create(options);
