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
            radiusKey: 'turbines',
            radiusName: 'Turbines',
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'compressors',
            radiusName: 'Compressors',
        },
        {
            type: 'nightingale',
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
            positionAngle: 90,
            label: {
                rotation: -90,
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
