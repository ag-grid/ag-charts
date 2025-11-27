import { ModuleRegistry, NumberAxisModule, UnitTimeAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, RangeAreaSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([NumberAxisModule, RangeAreaSeriesModule, UnitTimeAxisModule]);
const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'London Property Price Index Divergence',
    },
    subtitle: {
        text: 'Comparing Price Spread Between Property Types (2020-2023)',
        spacing: 45,
    },
    footnote: {
        text: 'Source: UK Gov Land Registry | Base Index: 100 (2015)',
    },
    formatter: {
        y: ({ value }) => {
            if (typeof value === 'number') {
                return value.toFixed(0);
            }
            return String(value);
        },
    },
    theme: {
        overrides: {
            'range-area': {
                series: {
                    fillOpacity: 0.35,
                    strokeWidth: 2,
                    strokeOpacity: 0.8,
                    label: {
                        enabled: true,
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'range-area',
            xKey: 'Date',
            yLowKey: 'Flats and maisonettes',
            yHighKey: 'Terraced houses',
            yLowName: 'Flats',
            yHighName: 'Terraced',
            label: {
                formatter: ({ value }) => `${value === 113.4 ? value : ''}`,
            },
            tooltip: {
                renderer: ({ datum, yLowKey, yHighKey, yLowName, yHighName }) => {
                    const date = new Date(datum.Date);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        month: 'short',
                        year: 'numeric',
                    });

                    const lowValue = datum[yLowKey];
                    const highValue = datum[yHighKey];
                    const spread = highValue - lowValue;

                    return {
                        heading: formattedDate,
                        title: `${yLowName} → ${yHighName}`,
                        data: [
                            { label: yLowName || yLowKey, value: lowValue.toFixed(1) },
                            { label: yHighName || yHighKey, value: highValue.toFixed(1) },
                            { label: 'Spread', value: `Δ${spread.toFixed(1)}` },
                        ],
                    };
                },
            },
        },
        {
            type: 'range-area',
            xKey: 'Date',
            yLowKey: 'Terraced houses',
            yHighKey: 'Semi-detached houses',
            yLowName: 'Terraced',
            yHighName: 'Semi-detached',
            label: {
                formatter: ({ value }) => `${value === 149.9 ? value : ''}`,
            },
            tooltip: {
                renderer: ({ datum, yLowKey, yHighKey, yLowName, yHighName }) => {
                    const date = new Date(datum.Date);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        month: 'short',
                        year: 'numeric',
                    });

                    const lowValue = datum[yLowKey];
                    const highValue = datum[yHighKey];
                    const spread = highValue - lowValue;

                    return {
                        heading: formattedDate,
                        title: `${yLowName} → ${yHighName}`,
                        data: [
                            { label: yLowName || yLowKey, value: lowValue.toFixed(1) },
                            { label: yHighName || yHighKey, value: highValue.toFixed(1) },
                            { label: 'Spread', value: `Δ${spread.toFixed(1)}` },
                        ],
                    };
                },
            },
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Price Index (2015 = 100)',
            },
            gridLine: {
                style: [{ strokeWidth: 1, lineDash: [2, 2] }, { strokeWidth: 0 }],
            },
            nice: false,
            min: 100,
            max: 160,
            interval: { step: 20 },
        },
        x: {
            type: 'unit-time',
            position: 'bottom',
            gridLine: {
                enabled: true,
                style: [{ strokeWidth: 1, lineDash: [2, 2] }, { strokeWidth: 0 }],
            },
        },
    },
    tooltip: {
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
};

AgCharts.create(options);
