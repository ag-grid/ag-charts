import {
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import {
    AgCartesianChartOptions,
    AgCharts,
    BandHighlightModule,
    ContextMenuModule,
    ErrorBarsModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    BandHighlightModule,
    ErrorBarsModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
]);
const dateFormatter = new Intl.DateTimeFormat('en-US');

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            line: {
                series: {
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
                yLowerKey: 'lowerPetrol',
                yUpperKey: 'upperPetrol',
            },
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'diesel',
            yName: 'Diesel',
            errorBar: {
                yLowerKey: 'lowerDiesel',
                yUpperKey: 'upperDiesel',
            },
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'unit-time',
            bandHighlight: {
                enabled: true,
            },
            crosshair: {
                enabled: false,
            },
        },
        y: {
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
    },
};

AgCharts.create(options);
