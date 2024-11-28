import {
    AgCharts,
    AgDonutSeriesTooltipRendererParams,
    AgPolarChartOptions,
    AgSeriesTooltip,
} from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();
const numFormatter = new Intl.NumberFormat('en-US');
const tooltip: AgSeriesTooltip<AgDonutSeriesTooltipRendererParams<any>> = {
    renderer: ({ datum, sectorLabelKey, calloutLabelKey, angleKey }) => ({
        data: [
            {
                label: datum[sectorLabelKey! ?? calloutLabelKey!],
                value: `${numFormatter.format(datum[angleKey] / 1000000)}M`,
            },
        ],
    }),
};

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Oxford Street Selfridges',
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
            tooltip,
        },
        {
            data: data['departments'],
            type: 'donut',
            sectorLabelKey: 'department',
            angleKey: 'value',
            outerRadiusRatio: 0.6,
            innerRadiusRatio: 0.4,
            fillOpacity: 0.6,
            tooltip,
        },
        {
            data: data['stores'],
            type: 'donut',
            sectorLabelKey: 'store',
            angleKey: 'total',
            outerRadiusRatio: 0.4,
            innerRadiusRatio: 0,
            tooltip: {
                renderer: ({ datum, angleKey }) => ({
                    data: [{ label: `Total`, value: `${numFormatter.format(datum[angleKey] / 1000000000)}B` }],
                }),
            },
        },
    ],
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
