import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import {
    AgBoxPlotSeriesTooltipRendererParams,
    AgCartesianChartOptions,
    AgCharts,
    BandHighlightModule,
    BoxPlotSeriesModule,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BandHighlightModule, BoxPlotSeriesModule, CategoryAxisModule, NumberAxisModule]);
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
    cornerRadius: 4,
    cap: {
        lengthRatio: 0,
    },
    tooltip: {
        renderer: ({ datum, yName }: AgBoxPlotSeriesTooltipRendererParams<any, unknown>) => {
            return {
                heading: datum.countryOfArrival,
                title: yName || 'Quarter',
                data: [
                    { label: 'Maximum', value: datum.max.toLocaleString() },
                    { label: 'Q3 (75th)', value: datum.q3.toLocaleString() },
                    { label: 'Median', value: datum.median.toLocaleString() },
                    { label: 'Q1 (25th)', value: datum.q1.toLocaleString() },
                    { label: 'Minimum', value: datum.min.toLocaleString() },
                ],
            };
        },
    },
};

const data = getData();
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Europe — Mixed Migration Flows',
    },
    subtitle: {
        text: 'Quarterly Overview (2023)',
    },
    footnote: {
        text: 'Source: UN International Organization for Migration',
    },
    padding: {
        left: 50,
        right: 20,
    },
    tooltip: {
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    series: [
        {
            type: 'box-plot',
            data: data['Jan - Mar 2023'],
            yName: 'Jan - Mar 2023',
            ...shared,
        },
        {
            type: 'box-plot',
            data: data['April - June 2023'],
            yName: 'April - June 2023',
            ...shared,
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'category',
            paddingInner: 0.5,
            paddingOuter: 0.2,
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
            line: {
                enabled: false,
            },
            label: {
                spacing: 10,
            },
        },
        y: {
            position: 'left',
            type: 'number',
            nice: false,
            title: {
                text: 'Number of Arrivals',
            },
            label: {
                enabled: true,
                formatter: ({ value }) => {
                    if (value >= 1000) {
                        return `${(value / 1000).toFixed(1)}K`;
                    }
                    return value.toLocaleString();
                },
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    },
};

AgCharts.create(options);
