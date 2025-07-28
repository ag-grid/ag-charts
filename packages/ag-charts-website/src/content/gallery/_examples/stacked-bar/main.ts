import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const numFormatter = new Intl.NumberFormat('en-US');

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: {
        baseTheme: 'ag-default',
        overrides: {
            bar: {
                series: {
                    label: { enabled: true },
                },
            },
        },
    },
    title: {
        text: 'Station Entries',
        fontSize: 20,
    },
    subtitle: {
        text: 'Victoria Line (2023)',
        fontSize: 14,
    },
    footnote: {
        text: 'Source: Transport for London',
        fontSize: 12,
        fontStyle: 'italic',
    },
    legend: {
        position: {
            placement: 'top-right',
            floating: true,
            xOffset: -40,
        },
        maxWidth: 300,
        border: {
            enabled: true,
            strokeWidth: 1,
        },
        cornerRadius: 8,
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
            paddingInner: 0.1,
            paddingOuter: 0.1,
            title: {
                text: 'Station',
                fontSize: 14,
            },
            label: {
                fontSize: 12,
            },
            bandHighlight: {
                enabled: true,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Percentage of Daily Entries',
                fontSize: 14,
            },
            label: {
                enabled: true,
                fontSize: 12,
                formatter: (params) => `${params.value}%`,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            crosshair: {
                enabled: true,
                label: {
                    enabled: true,
                },
            },
        },
    ],
    formatter: {
        x(params) {
            if (params.source === 'axis-label') {
                return (params.value as string).replace(' ', '\n');
            }
            return String(params.value);
        },
        y(params) {
            const value = params.value as number;
            if (params.source === 'crosshair') {
                return `${value.toFixed(1)}%`;
            }
            return numFormatter.format(value);
        },
    },
};
AgCharts.create(options);
