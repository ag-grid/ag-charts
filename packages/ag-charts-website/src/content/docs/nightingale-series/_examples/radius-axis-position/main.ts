import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Night & Gale Inc revenue`,
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
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'winds',
            radiusName: 'Polar winds',
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'holes',
            radiusName: 'Donut holes',
        },
    ],
    axes: [
        {
            type: 'angle-category',
        },
        {
            type: 'radius-number',
            positionAngle: 68,
            label: {
                rotation: -68,
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
