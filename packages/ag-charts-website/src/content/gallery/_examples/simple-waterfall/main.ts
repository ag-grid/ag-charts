import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    CategoryAxisModule,
    LegendModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';
import { BandHighlightModule, WaterfallSeriesModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';


ModuleRegistry.registerModules([BandHighlightModule, CategoryAxisModule, LegendModule, NumberAxisModule, WaterfallSeriesModule]);
const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Manchester United Transfers',
    },
    subtitle: {
        text: 'Outgoing Sales & Incoming Signings from Season 2023-2024',
    },
    footnote: {
        text: 'Arrivals: 17, Departures: 11',
    },
    series: [
        {
            type: 'waterfall',
            xKey: 'player',
            xName: 'Player',
            yKey: 'fee',
            yName: 'Fee',
            item: {
                positive: {
                    name: 'Outs',
                    label: { enabled: true },
                    itemStyler: ({ datum }) => ({
                        fillOpacity: Math.max(0.5, datum.fee / 17.5),
                    }),
                },
                negative: {
                    name: 'Ins',
                    label: { enabled: true },
                    itemStyler: ({ datum }) => ({
                        fillOpacity: Math.max(0.5, Math.abs(datum.fee) / 75),
                    }),
                },
            },
            line: {
                strokeWidth: 2,
                lineDash: [3, 3],
            },
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'left',
            interval: { values: [0, -148.1] },
            gridLine: {
                style: [{ strokeWidth: 1, lineDash: [2, 2] }, { strokeWidth: 0 }],
            },
        },
        x: {
            type: 'category',
            position: 'top',
            gridLine: { enabled: true },
            bandHighlight: {
                enabled: true,
            },
        },
    },
    legend: {
        position: {
            floating: true,
            placement: 'bottom-right',
            xOffset: -20,
            yOffset: -20,
        },
    },
    formatter: {
        y: ({ value }) => {
            if (typeof value !== 'number') return;
            if (value === 0) return '£0';
            return value > 0 ? `+£${value}M` : `-£${Math.abs(value)}M`;
        },
    },
};

AgCharts.create(options);
