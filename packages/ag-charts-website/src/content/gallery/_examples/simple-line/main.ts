import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const dateFormatter = new Intl.DateTimeFormat('en-US');

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            line: {
                series: {
                    strokeWidth: 2,
                    marker: {
                        size: 6,
                    },
                    tooltip: {
                        renderer: ({ datum, yKey, yName, yLowerKey, yUpperKey }) => {
                            const date = dateFormatter.format(datum.date);
                            const value = datum[yKey!] as number;
                            const lower = datum[yLowerKey!] as number;
                            const upper = datum[yUpperKey!] as number;

                            return {
                                heading: `${date}`,
                                data: [
                                    {
                                        label: yName!,
                                        value: `${value.toFixed(2)}p (${lower.toFixed(1)}p - ${upper.toFixed(1)}p)`,
                                    },
                                ],
                            };
                        },
                    },
                },
            },
        },
    },
    data: getData(),
    animation: {
        enabled: true,
        duration: 800,
    },
    title: {
        text: 'UK Road Fuel Prices 2019',
        fontSize: 20,
        fontFamily: 'Inter, system-ui, sans-serif',
    },
    footnote: {
        text: 'Source: Department for Business, Energy & Industrial Strategy',
        fontSize: 12,
        fontStyle: 'italic',
    },
    legend: {
        position: {
            placement: 'right-top',
            floating: true,
        },
        border: {
            enabled: true,
            strokeWidth: 1,
        },
        cornerRadius: 8,
        padding: 16,
        item: {
            label: { fontSize: 14 },
            marker: { size: 16 },
            paddingX: 16,
            paddingY: 8,
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'petrol',
            yName: 'Petrol',
            errorBar: {
                visible: true,
                yLowerKey: 'lowerPetrol',
                yUpperKey: 'upperPetrol',
                strokeWidth: 1,
                cap: {
                    length: 6,
                    lengthRatio: 0.5,
                },
            },
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'diesel',
            yName: 'Diesel',
            errorBar: {
                visible: true,
                yLowerKey: 'lowerDiesel',
                yUpperKey: 'upperDiesel',
                strokeWidth: 1,
                cap: {
                    length: 6,
                    lengthRatio: 0.5,
                },
            },
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'unit-time',
            label: {
                fontSize: 12,
            },
            bandHighlight: {
                enabled: true,
            },
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Price (pence per litre)',
                fontSize: 14,
                fontFamily: 'Inter, system-ui, sans-serif',
            },
            label: {
                fontSize: 12,
                formatter: (params) => `${params.value}p`,
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
    ],
    tooltip: {
        position: {
            anchorTo: 'pointer',
            placement: ['right', 'left', 'top', 'bottom'],
            xOffset: 10,
            yOffset: -10,
        },
        wrapping: 'hyphenate',
    },
};

AgCharts.create(options);
