import {
    AgCartesianSeriesTooltipRendererParams,
    AgChartOptions,
    AgEnterpriseCharts,
    AgTooltipRendererResult,
} from 'ag-charts-enterprise';

import { getData } from './data';

const numFormatter = new Intl.NumberFormat('en-US');
const tooltip = {
    renderer: ({ title, datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams): AgTooltipRendererResult => ({
        title,
        content: `${datum[xKey]}: ${numFormatter.format(datum[yKey])}`,
    }),
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: {
        overrides: {
            bar: {
                series: {
                    stroke: 'transparent',
                    strokeWidth: 2,
                    fillOpacity: 0.8,
                    label: {
                        enabled: true,
                        formatter: ({ value }) => `${numFormatter.format(value)}`
                    },
                },
            },
        },
    },
    title: {
        text: 'Average Station Entries',
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
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'morningPeak',
            yName: 'Morning peak',
            stacked: true,
            normalizedTo: 100,
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'interPeak',
            yName: 'Between peak',
            stacked: true,
            normalizedTo: 100,
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'afternoonPeak',
            yName: 'Afternoon peak',
            stacked: true,
            normalizedTo: 100,
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'evening',
            yName: 'Evening',
            stacked: true,
            normalizedTo: 100,
            tooltip,
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
        },
    ],
};
AgEnterpriseCharts.create(options);
