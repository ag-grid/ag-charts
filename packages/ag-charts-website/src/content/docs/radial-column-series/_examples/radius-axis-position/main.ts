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
        },
        {
            type: 'radius-number',
            innerRadiusRatio: 0.25,
            positionAngle: 90,
            label: {
                rotation: -90,
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
