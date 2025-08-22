import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();
const numFormatter = new Intl.NumberFormat('en-US');

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Oxford Street Department Store',
    },
    subtitle: {
        text: 'Total Product Value by Department',
    },
    series: [
        {
            data: data['categories'],
            type: 'donut',
            calloutLabelKey: 'category',
            calloutLabel: {
                offset: 10,
            },
            angleKey: 'value',
            radiusKey: 'value',
            outerRadiusRatio: 0.8,
            innerRadiusRatio: 0.6,
            fillOpacity: 0.4,
        },
        {
            data: data['departments'],
            type: 'donut',
            sectorLabelKey: 'department',
            angleKey: 'value',
            outerRadiusRatio: 0.6,
            innerRadiusRatio: 0.4,
            fillOpacity: 0.6,
        },
        {
            data: data['stores'],
            type: 'donut',
            sectorLabelKey: 'store',
            angleKey: 'total',
            outerRadiusRatio: 0.4,
            innerRadiusRatio: 0,
        },
    ],
    legend: {
        enabled: false,
    },
    formatter: {
        angle: (params) => {
            const value = params.value as number;
            return value < 1e9 ? `${numFormatter.format(value / 1e6)}M` : `${numFormatter.format(value / 1e9)}B`;
        },
    },
};

AgCharts.create(options);
