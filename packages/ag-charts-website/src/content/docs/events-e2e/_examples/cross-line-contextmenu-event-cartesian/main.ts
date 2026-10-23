import {
    AgCharts,
    AreaSeriesModule,
    ContextMenuModule,
    CrossLinesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';
import type { AgCartesianChartOptions, AgContextMenuItem, AgCrossLineListeners } from 'ag-charts-types';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AreaSeriesModule,
    ContextMenuModule,
    CrossLinesModule,
    LegendModule,
    NumberAxisModule,
    UnitTimeAxisModule,
]);

const lockdownLabelStyle = { fontStyle: 'italic', placement: 'bottom' } as const;
const variantLineStyle = { strokeWidth: 2, lineDash: [6, 4] };
const variantLabelStyle = { placement: 'top' } as const;

const lockdownListeners: AgCrossLineListeners = {
    click: (event) => console.log('[lockdown click]', event),
    doubleClick: (event) => console.log('[lockdown double click]', event),
};

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'COVID-19 ICU Bed Usage',
    },
    subtitle: {
        text: 'Monthly peak ICU occupancy',
    },
    data: getData(),
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            label: {
                spacing: 25,
            },
            crossLines: [
                {
                    id: 'first-lockdown',
                    type: 'range',
                    range: [new Date(2020, 2, 23), new Date(2020, 5, 1)],
                    label: {
                        text: 'First lockdown',
                        ...lockdownLabelStyle,
                    },
                    listeners: lockdownListeners,
                },
                {
                    id: 'winter-lockdown',
                    type: 'range',
                    range: [new Date(2020, 10, 5), new Date(2021, 1, 15)],
                    label: {
                        text: 'Winter lockdown',
                        ...lockdownLabelStyle,
                    },
                    listeners: lockdownListeners,
                },
                {
                    id: 'soft-lockdown',
                    type: 'range',
                    range: [new Date(2021, 11, 20), new Date(2022, 1, 15)],
                    label: {
                        text: 'Soft lockdown',
                        ...lockdownLabelStyle,
                    },
                    listeners: lockdownListeners,
                },
                {
                    id: 'alpha-variant',
                    type: 'line',
                    value: new Date(2020, 11, 1),
                    ...variantLineStyle,
                    label: {
                        text: 'Alpha',
                        ...variantLabelStyle,
                    },
                },
                {
                    id: 'delta-variant',
                    type: 'line',
                    value: new Date(2021, 6, 1),
                    ...variantLineStyle,
                    label: {
                        text: 'Delta',
                        ...variantLabelStyle,
                    },
                },
                {
                    id: 'omicron-variant',
                    type: 'line',
                    value: new Date(2021, 10, 1),
                    ...variantLineStyle,
                    label: {
                        text: 'Omicron',
                        ...variantLabelStyle,
                    },
                },
            ],
            listeners: {
                crossLineClick: (event) => console.log('[x axis cross line click]', event),
                crossLineDoubleClick: (event) => console.log('[x axis cross line double click]', event),
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'ICU beds occupied',
            },
            crossLines: [
                {
                    id: 'icu-capacity',
                    type: 'line',
                    value: 700,
                    strokeWidth: 2,
                    lineDash: [8, 4],
                    label: {
                        text: 'ICU capacity (700 beds)',
                        placement: 'top-right',
                    },
                    listeners: {
                        click: (event) => console.log('[capacity click]', event),
                        doubleClick: (event) => console.log('[capacity double click]', event),
                    },
                },
                {
                    id: 'surge-zone',
                    type: 'range',
                    range: [500, 600],
                    label: {
                        text: 'Surge zone',
                        placement: 'inside-left',
                    },
                    listeners: {
                        click: (event) => console.log('[surge click]', event),
                        doubleClick: (event) => console.log('[surge double click]', event),
                    },
                },
            ],
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'maxICU',
            yName: 'ICU beds occupied',
            strokeWidth: 1,
            fillOpacity: 0.5,
        },
    ],
    listeners: {
        crossLineClick: (event) => console.log('[chart cross line click]', event),
        crossLineDoubleClick: (event) => console.log('[chart cross line double click]', event),
    },
    contextMenu: {
        getItems: (ev) => {
            const always: AgContextMenuItem<DataType>[] = [];
            const axis: AgContextMenuItem<DataType>[] = [];
            const crossline: AgContextMenuItem<DataType>[] = [];
            const caption: AgContextMenuItem<DataType>[] = [];
            const seriesArea: AgContextMenuItem<DataType>[] = [];
            const seriesNode: AgContextMenuItem<DataType>[] = [];
            const legendItem: AgContextMenuItem<DataType>[] = [];

            for (const el of ev.allShowOnParams) {
                switch (el.showOn) {
                    case 'always':
                        always.push({
                            showOn: 'always',
                            label: 'Say hello',
                            action: () => {
                                console.log('Hello world!');
                            },
                        });
                        break;
                    case 'axis':
                        axis.push({
                            showOn: 'axis',
                            label: `Say hello to ${el.direction}}-axis ${el.axisId}, ${el.value}`,
                            action: () => {
                                console.log(`Hello in axis "${el.axisId}":"`);
                            },
                        });
                        break;
                    case 'cross-line':
                        crossline.push({
                            showOn: 'cross-line',
                            label: `Say hello to ${el.crossLineType} cross line ${el.crossLineId}`,
                            action: ({ value, direction, crossLineType }) => {
                                console.log(`Hello ${direction}-${crossLineType} ${value}!`);
                            },
                        });
                        break;
                    case 'caption':
                        caption.push({
                            showOn: 'caption',
                            label: `Say hello in ${el.captionType} caption: ${el.text}`,
                            action: ({ captionType, text }) => {
                                console.log(`Hello in a ${captionType} caption: "${text}"`);
                            },
                        });
                        break;
                    case 'series-area':
                        seriesArea.push({
                            showOn: 'series-area',
                            label: 'Say hello in the series area',
                            action: () => {
                                console.log('Hello in the series area!');
                            },
                        });
                        break;
                    case 'series-node':
                        const month = el.datum.month;
                        const value = el.datum.maxICU;
                        seriesNode.push({
                            showOn: 'series-node',
                            label: `Say hello to ${value} in ${month}`,
                            action: () => {
                                console.log(`Hello ${value} in ${month}!`);
                            },
                        });
                        break;
                    case 'legend-item':
                        legendItem.push({
                            showOn: 'legend-item',
                            label: `Say hello to legend item ${el.itemId}`,
                            action: ({ itemId }) => {
                                console.log(`Hello ${itemId}!`);
                            },
                        });
                        break;
                    default:
                        el;
                }
            }
            return [
                'defaults',
                'separator',
                ...always,
                'separator',
                ...axis,
                'separator',
                ...crossline,
                'separator',
                ...caption,
                'separator',
                ...seriesArea,
                'separator',
                ...seriesNode,
                'separator',
                ...legendItem,
            ];
        },
    },
};

AgCharts.create(options);
