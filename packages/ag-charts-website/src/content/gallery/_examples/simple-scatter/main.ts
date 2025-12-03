import {
    AgCartesianChartOptions,
    AgCharts,
    ContextMenuModule,
    ModuleRegistry,
    NumberAxisModule,
    ScatterSeriesModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([NumberAxisModule, ScatterSeriesModule]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Height vs Weight for Major League Baseball Players',
    },
    subtitle: {
        text: 'Analysis of 1,040 MLB players showing physical characteristics correlation',
    },
    footnote: {
        text: 'Source: Statistics Online Computational Resource',
    },
    series: [
        {
            type: 'scatter',
            xKey: 'weight',
            xName: 'Weight',
            yKey: 'height',
            yName: 'Height',
            size: 6,
            fillOpacity: 0.6,
            strokeOpacity: 0.8,
            tooltip: {
                enabled: true,
                renderer: (params) => {
                    const { datum, xKey, yKey } = params;
                    const height = datum[yKey] as number;
                    const weight = datum[xKey] as number;
                    const feet = Math.floor(height / 12);
                    const inches = Math.floor(height % 12);
                    return {
                        title: datum.team,
                        data: [
                            { label: 'Height:', value: `${feet}' ${inches}` },
                            { label: 'Weight:', value: `${weight} lbs` },
                        ],
                    };
                },
            },
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            nice: false,
            line: { enabled: false },
            title: {
                text: 'Weight (lbs)',
            },
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0, // Alternating bands
                    },
                ],
            },
            crossLines: [
                {
                    type: 'line',
                    value: 201, // Approximate mean weight
                    strokeWidth: 2,
                    strokeOpacity: 0.7,
                    lineDash: [6, 4],
                    label: {
                        text: 'Mean: 201 lbs',
                        position: 'top-left',
                        padding: 8,
                    },
                },
            ],
        },
        y: {
            position: 'left',
            type: 'number',
            nice: false,
            line: { enabled: false },
            title: {
                text: 'Height',
            },
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0, // Alternating bands
                    },
                ],
            },
            crossLines: [
                {
                    type: 'line',
                    value: 73.7, // Approximate mean height
                    strokeWidth: 2,
                    strokeOpacity: 0.7,
                    lineDash: [6, 4],
                    label: {
                        text: `Mean: 6'2"`,
                        position: 'bottom-right',
                        padding: 8,
                    },
                },
            ],
        },
    },
    formatter: {
        x: '#{.0f} lbs',
        y: (params) => {
            const value = params.value as number;
            return `${Math.floor(value / 12)}' ${Math.floor(value % 12)}"`;
        },
    },
};

AgCharts.create(options);
