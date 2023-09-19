import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Revenue by product category`,
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
            innerRadiusRatio: 0.25,
            positionAngle: 90,
            label: {
                rotation: -90,
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
