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
            grouped: true,
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'winds',
            radiusName: 'Polar winds',
            grouped: true,
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'holes',
            radiusName: 'Donut holes',
            grouped: true,
        },
    ],
    axes: [
        {
            type: 'angle-category',
            groupPaddingInner: 0.5,
            paddingInner: 0.4,
        },
        {
            type: 'radius-number',
            innerRadiusRatio: 0.25,
        },
    ],
};

AgEnterpriseCharts.create(options);
