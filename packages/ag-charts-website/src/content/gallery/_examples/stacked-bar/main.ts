import {
    AgCartesianSeriesTooltipRendererParams,
    AgChartOptions,
    AgCharts,
    AgTooltipRendererResult,
} from 'ag-charts-enterprise';

import { getData } from './data';

const numFormatter = new Intl.NumberFormat('en-US');

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: {
        overrides: {
            bar: {
                series: {
                    stroke: 'transparent',
                    strokeWidth: 2,
                    cornerRadius: 6,
                    fillOpacity: 0.8,
                    label: {
                        enabled: true,
                        formatter: ({ value }) => `${numFormatter.format(value)}`,
                    },
                    tooltip: {
                        renderer: ({
                            title,
                            datum,
                            xKey,
                            yKey,
                        }: AgCartesianSeriesTooltipRendererParams): AgTooltipRendererResult => ({
                            title,
                            content: `${datum[xKey]}: ${numFormatter.format(datum[yKey])}`,
                        }),
                    },
                },
            },
        },
    },
    title: {
        text: 'Station Entries',
        fontSize: 18,
    },
    subtitle: {
        text: 'Victoria Line (2023)',
    },
    footnote: {
        text: 'Source: Transport for London',
    },
    series: [
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'early',
            yName: 'Early',
            stacked: true,
            normalizedTo: 100,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'morningPeak',
            yName: 'Morning peak',
            stacked: true,
            normalizedTo: 100,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'interPeak',
            yName: 'Between peak',
            stacked: true,
            normalizedTo: 100,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'afternoonPeak',
            yName: 'Afternoon peak',
            stacked: true,
            normalizedTo: 100,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'evening',
            yName: 'Evening',
            stacked: true,
            normalizedTo: 100,
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            paddingInner: 0,
            groupPaddingInner: 0,
            paddingOuter: 0,
        },
        {
            type: 'number',
            position: 'left',
            nice: false,
            gridLine: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
            crosshair: {
                enabled: false,
            },
        },
    ],
};
AgCharts.create(options);
