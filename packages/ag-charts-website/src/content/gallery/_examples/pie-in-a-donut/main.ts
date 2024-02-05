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
    sectorLabel: {
        formatter: ({ datum, sectorLabelKey }) => {
            return numFormatter.format(datum[sectorLabelKey!]);
        },
    },
    legendItemKey: 'browser',
    tooltip: {
        renderer: ({ datum, sectorLabelKey = 'share' }) => {
            return {
                title: datum['year'],
                content: `${datum['browser']}: ${numFormatter.format(datum[sectorLabelKey])}`,
            };
        },
    },
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
            innerRadiusRatio: 0.7,
            title: {
                text: 'September 2022',
            },
            calloutLabelKey: 'browser',
            calloutLabel: {
                minAngle: 25,
            },
        },
    ],
};

AgCharts.create(options);
