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
            radiusName: 'Turbines',
            grouped: true,
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'winds',
            radiusName: 'Compressors',
            grouped: true,
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'holes',
            radiusName: 'Smoke Detectors',
            grouped: true,
        },
    ],
    axes: [
        {
            type: 'angle-category',
            groupPaddingInner: 0.5,
            paddingInner: 0.5,
        },
        {
            type: 'radius-number',
            innerRadiusRatio: 0.2,
        },
    ],
};

AgEnterpriseCharts.create(options);
