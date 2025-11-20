import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { LineSeriesModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Trigonometric Functions',
    },
    subtitle: {
        text: 'Mathematical relationships from -2π to 2π',
    },
    data: getData(),
    tooltip: {
        enabled: true,
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'x',
            yKey: 'sinX',
            yName: 'Sine',
            strokeWidth: 4,
            marker: {
                enabled: false,
            },
        },
        {
            type: 'line',
            xKey: 'x',
            yKey: 'cosX',
            yName: 'Cosine',
            strokeWidth: 4,
            marker: {
                enabled: false,
            },
        },
        {
            type: 'line',
            xKey: 'x',
            yKey: 'tanX',
            yName: 'Tangent',
            strokeWidth: 4,
            marker: {
                enabled: false,
            },
        },
        {
            type: 'line',
            xKey: 'x',
            yKey: 'cscX',
            yName: 'Cosecant',
            lineDash: [4, 1, 4],
            strokeWidth: 3,
            strokeOpacity: 0.8,
            marker: {
                enabled: false,
            },
        },
        {
            type: 'line',
            xKey: 'x',
            yKey: 'secX',
            yName: 'Secant',
            lineDash: [4, 1, 4],
            strokeWidth: 3,
            strokeOpacity: 0.8,
            marker: {
                enabled: false,
            },
        },
        {
            type: 'line',
            xKey: 'x',
            yKey: 'cotX',
            yName: 'Cotangent',
            lineDash: [4, 1, 4],
            strokeWidth: 3,
            strokeOpacity: 0.8,
            marker: {
                enabled: false,
            },
        },
    ],
    axes: {
        y: {
            position: 'left',
            type: 'number',
            min: -3,
            max: 3,
            crossLines: [
                {
                    type: 'line',
                    value: 0,
                    label: {
                        text: '► X',
                        position: 'right',
                        padding: 0,
                    },
                },
                {
                    type: 'range',
                    range: [-1, 1],
                    strokeWidth: 0,
                },
            ],
        },
        x: {
            position: 'bottom',
            type: 'number',
            nice: false,
            interval: { step: Math.PI },
            crossLines: [
                {
                    type: 'line',
                    value: 0,
                    label: {
                        text: 'Y\n▲',
                        position: 'top',
                        padding: 0,
                    },
                },
            ],
        },
    },
    formatter: {
        x(params) {
            const value = params.value as number;
            if (params.source === 'axis-label') {
                return `${Math.round(value / Math.PI)}π`;
            }
            // For tooltips and crosshairs
            const piValue = value / Math.PI;
            const formatted =
                Math.abs(piValue) < 0.01
                    ? '0'
                    : Math.abs(piValue - 0.5) < 0.01
                      ? 'π/2'
                      : Math.abs(piValue + 0.5) < 0.01
                        ? '-π/2'
                        : Math.abs(piValue - 1) < 0.01
                          ? 'π'
                          : Math.abs(piValue + 1) < 0.01
                            ? '-π'
                            : Math.abs(piValue - 1.5) < 0.01
                              ? '3π/2'
                              : Math.abs(piValue + 1.5) < 0.01
                                ? '-3π/2'
                                : `${piValue.toFixed(2)}π`;
            return formatted;
        },
    },
};

AgCharts.create(options);
