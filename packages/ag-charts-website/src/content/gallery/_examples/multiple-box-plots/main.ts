import { AgBoxPlotSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const tooltip = (label: string) => ({
    renderer: (params: AgBoxPlotSeriesTooltipRendererParams) => {
        const {
            datum,
            xKey,
            xName,
            minKey,
            minName,
            q1Key,
            q1Name,
            medianKey,
            medianName,
            q3Key,
            q3Name,
            maxKey,
            maxName,
        } = params;
        const values = [
            `${xName}: ${datum[xKey]}`,
            `${minName}: ${datum[minKey]}`,
            `${q1Name}: ${datum[q1Key]}`,
            `${medianName}: ${datum[medianKey]}`,
            `${q3Name}: ${datum[q3Key]}`,
            `${maxName}: ${datum[maxKey]}`,
        ];
        return `<div class="ag-chart-tooltip-title">${label}</div><div class="ag-chart-tooltip-content">${values.join('<br>')}</div>`;
    },
});

const shared = {
    xKey: 'countryOfArrival',
    xName: 'Country Of Arrival',
    minKey: 'min',
    minName: 'Min',
    q1Key: 'q1',
    q1Name: 'Q1',
    medianKey: 'median',
    medianName: 'Median',
    q3Key: 'q3',
    q3Name: 'Q3',
    maxKey: 'max',
    maxName: 'Max',
    cornerRadius: 8,
    strokeOpacity: 0,
    whisker: {
        strokeOpacity: 1,
    },
    cap: {
        lengthRatio: 0,
    },
};

const data = getData();
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Europe — Mixed Migration Flows',
    },
    subtitle: {
        text: 'Quarterly Overview',
    },
    footnote: {
        text: 'Source: UN International Organization for Migration',
    },
    series: [
        {
            type: 'box-plot',
            data: data['Jan - Mar 2023'],
            yName: 'Jan - Mar 2023',
            tooltip: tooltip('Jan - Mar 2023'),
            ...shared,
        },
        {
            type: 'box-plot',
            data: data['April - June 2023'],
            yName: 'April - June 2023',
            tooltip: tooltip('April - June 2023'),
            ...shared,
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'category',
            paddingInner: 0.5,
            paddingOuter: 0.2,
            gridLine: {
                enabled: true,
            },
            line: {
                enabled: false,
            },
            label: {
                padding: 10,
            },
        },
        {
            position: 'left',
            type: 'number',
            line: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
