import { AgEnterpriseCharts, AgPieSeriesTooltipRendererParams, AgPolarChartOptions, AgPolarSeriesOptions } from 'ag-charts-enterprise';
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
        renderer: ({ datum, color, sectorLabelKey }: AgPieSeriesTooltipRendererParams) => {
            return [
                `<div style="background-color: ${color}; padding: 4px 8px; border-top-left-radius: 5px; border-top-right-radius: 5px; color: white; font-weight: bold;">`,
                datum['year'],
                `</div>`,
                `<div style="padding: 4px 8px;">`,
                `  <strong>${datum['browser']}:</strong> ${numFormatter.format(datum[sectorLabelKey!])}`,
                `</div>`,
            ].join('\n');
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

AgEnterpriseCharts.create(options);
