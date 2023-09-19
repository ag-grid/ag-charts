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
            radiusKey: 'turbines',
            radiusName: 'Turbines',
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'compressors',
            radiusName: 'Compressors',
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'smoke_detectors',
            radiusName: 'Smoke Detectors',
        },
    ],
    axes: [
        {
            type: 'angle-category',
        },
        {
            type: 'radius-number',
            innerRadiusRatio: 0.2,
        },
    ],
};

AgEnterpriseCharts.create(options);
