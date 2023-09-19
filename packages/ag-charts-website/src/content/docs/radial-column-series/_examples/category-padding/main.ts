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
            grouped: true,
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'compressors',
            radiusName: 'Compressors',
            grouped: true,
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'smoke_detectors',
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
