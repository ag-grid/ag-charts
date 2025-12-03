import {
    AgCartesianChartOptions,
    AgCharts,
    AgRangeAreaSeriesItemStylerParams,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    RangeAreaSeriesModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    RangeAreaSeriesModule,
    UnitTimeAxisModule,
    ContextMenuModule,
]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'AA-Rated Corporate Bond Yield Range (2024)',
    },
    data: getData(),
    series: [
        {
            type: 'range-area',
            xKey: 'date',
            yLowKey: 'low',
            yHighKey: 'high',
            fill: {
                type: 'gradient',
                colorStops: [{ color: '#8ADAF100', stop: 0 }, { color: '#8ADAF1cc' }],
            },
            // Shared high/low styling options:
            strokeWidth: 2,
            marker: {
                size: 12,
                fill: '#cccccc',
                itemStyler: (params: AgRangeAreaSeriesItemStylerParams<DataType, unknown>) => {
                    // Highlight datum styling options:
                    if (params.highlightState === 'highlighted-item') {
                        if (params.itemType === 'high') {
                            return { fill: '#53c653' };
                        }
                        if (params.itemType === 'low') {
                            return { fill: '#ff3333' };
                        }
                    }
                    return {};
                },
            },
            // Distinguished high/low styling options:
            item: {
                high: {
                    stroke: '#39ac39',
                    marker: {
                        stroke: '#39ac39',
                    },
                },
                low: {
                    stroke: '#e60000',
                    marker: {
                        stroke: '#e60000',
                    },
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
        },
        y: {
            type: 'number',
            label: { format: '#{0.1%}' },
        },
    },
};

AgCharts.create(options);
