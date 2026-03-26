import {
    AgCartesianChartOptions,
    AgCharts,
    BandHighlightModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    ErrorBarsModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    BandHighlightModule,
    BarSeriesModule,
    CategoryAxisModule,
    ErrorBarsModule,
    NumberAxisModule,
]);
const data = getData();
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Weekly Earnings by Profession',
    },
    subtitle: {
        text: 'UK Average Weekly Pay with Confidence Intervals',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
        fontStyle: 'italic',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'type',
            yKey: 'earnings',
            yName: 'Weekly Earnings',
            cornerRadius: 6,
            strokeWidth: 1,
            errorBar: {
                yLowerKey: 'earningsLower',
                yUpperKey: 'earningsUpper',
                cap: {
                    length: 8,
                },
            },
            label: {
                enabled: true,
                formatter: (params) => `£${params.value}`,
            },
            itemStyler: ({ datum, yKey }) => ({
                fillOpacity: getOpacity(datum, yKey, 0.4, 1),
            }),
        },
    ],
    axes: {
        y: {
            type: 'category',
            title: {
                text: 'Profession',
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
        x: {
            type: 'number',
            title: {
                enabled: true,
                text: 'Weekly Earnings (£)',
            },
            label: {
                formatter: (params) => `£${params.value.toLocaleString()}`,
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
    },
    tooltip: {
        position: {
            anchorTo: 'pointer',
            placement: ['right', 'left', 'top', 'bottom'],
            xOffset: 10,
            yOffset: -10,
        },
    },
};

function getOpacity(datum: DataType, key: keyof DataType, minOpacity: number, maxOpacity: number) {
    const [min, max] = getDomain(key);
    const value = Number(datum[key]);
    let alpha = Math.round(((value - min) / (max - min)) * 10) / 10;
    return map(alpha, 0, 1, minOpacity, maxOpacity);
}

function getDomain(key: keyof DataType) {
    const min = Math.min(...data.map((d) => Number(d[key])));
    const max = Math.max(...data.map((d) => Number(d[key])));
    return [min, max];
}

function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

AgCharts.create(options);
