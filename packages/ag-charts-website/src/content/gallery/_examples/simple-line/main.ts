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
    },
    footnote: {
        text: 'Source: Department for Business, Energy & Industrial Strategy',
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
            label: {},
            bandHighlight: {
                enabled: true,
            },
            crosshair: {
                enabled: false,
            },
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Price (pence per litre)',
            },
            label: {
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
    tooltip: {},
};

AgCharts.create(options);
