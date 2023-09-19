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
            innerRadiusRatio: 0.2,
        },
    ],
};

AgEnterpriseCharts.create(options);
