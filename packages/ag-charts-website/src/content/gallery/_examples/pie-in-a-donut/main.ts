import { AgCharts, AgPolarChartOptions, AgPolarSeriesOptions } from 'ag-charts-enterprise';

import { getData2020, getData2022 } from './data';

const numFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 0,
});

const sharedSeriesOptions: AgPolarSeriesOptions = {
    type: 'pie',
    sectorLabelKey: 'share',
    angleKey: 'share',
    legendItemKey: 'browser',
};

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Desktop Browser Market Share 2020 vs 2022',
    },
    series: [
        {
            ...sharedSeriesOptions,
            data: getData2020(),
            outerRadiusRatio: 0.5,
            showInLegend: false,
            title: {
                text: 'January 2020',
            },
        },
        {
            ...sharedSeriesOptions,
            type: 'donut',
            data: getData2022(),
            title: {
                text: 'September 2022',
            },
            calloutLabelKey: 'browser',
            calloutLabel: {
                minAngle: 25,
            },
        },
    ],
    formatter: (params) =>
        typeof params.value === 'number' ? numFormatter.format(params.value) : String(params.value),
};

AgCharts.create(options);
