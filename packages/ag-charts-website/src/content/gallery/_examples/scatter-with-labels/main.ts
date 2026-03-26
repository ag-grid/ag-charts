import {
    AgCartesianChartOptions,
    AgCharts,
    AgScatterSeriesTooltipRendererParams,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    ScatterSeriesModule,
} from 'ag-charts-enterprise';

import { NameData, getData } from './data';

ModuleRegistry.registerModules([AnimationModule, CrosshairModule, LegendModule, NumberAxisModule, ScatterSeriesModule]);
const data = getData();

const options: AgCartesianChartOptions<NameData> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'British Baby Names: Popularity vs Trend Analysis',
    },
    animation: {
        enabled: true,
        duration: 800,
    },
    series: [
        {
            data: data.filter((d: NameData) => d.gender === 'Boy'),
            type: 'scatter' as const,
            xKey: 'popularity',
            xName: 'Popularity Index',
            yKey: 'trend',
            yName: 'Boy Names',
            labelKey: 'name',
            labelName: 'Name',
            label: {
                enabled: true,
                placement: 'top',
            },
            shape: 'square',
            size: 8,
            strokeWidth: 2,
            fillOpacity: 0.8,
            tooltip: {
                renderer: ({ datum, xKey, yKey }: AgScatterSeriesTooltipRendererParams<NameData>) => {
                    return {
                        title: datum.name,
                        data: [
                            { label: 'Popularity Index', value: datum[xKey].toString() },
                            { label: 'Trend Score', value: datum[yKey].toString() },
                        ],
                    };
                },
            },
        },
        {
            data: data.filter((d: NameData) => d.gender === 'Girl'),
            type: 'scatter',
            xKey: 'popularity',
            xName: 'Popularity Index',
            yKey: 'trend',
            yName: 'Girl Names',
            labelKey: 'name',
            labelName: 'Name',
            label: {
                enabled: true,
                placement: 'top',
            },
            size: 8,
            strokeWidth: 2,
            fillOpacity: 0.8,
            tooltip: {
                renderer: ({ datum, xKey, yKey }) => {
                    const nameData = datum as NameData;
                    return {
                        title: nameData.name,
                        data: [
                            { label: 'Popularity Index', value: nameData[xKey as keyof NameData].toString() },
                            { label: 'Trend Score', value: nameData[yKey as keyof NameData].toString() },
                        ],
                    };
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'number',
            title: {
                text: 'Popularity Index →',
            },
            min: 0,
            max: 100,
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                ],
            },
            crosshair: {
                enabled: true,
                strokeWidth: 1,
                lineDash: [5, 5],
                label: {
                    enabled: true,
                    format: '.0f',
                },
            },
            label: {
                enabled: true,
                formatter: ({ value }) => (value === 0 ? 'Rare' : value === 100 ? 'Popular' : `${value}`),
            },
        },
        y: {
            type: 'number',
            title: {
                text: 'Trend Score',
            },
            min: 0,
            max: 10,
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                ],
            },
            crosshair: {
                enabled: true,
                strokeWidth: 1,
                lineDash: [5, 5],
                label: {
                    enabled: true,
                    format: '.1f',
                },
            },
            label: {
                enabled: true,
                formatter: ({ value }) => (value === 0 ? 'Declining' : value === 10 ? 'Rising' : `${value}`),
            },
        },
    },
    legend: {
        position: {
            placement: 'right-bottom',
            floating: true,
            xOffset: -20,
            yOffset: -20,
        },
        border: {
            enabled: true,
        },
        item: {
            marker: {
                size: 12,
                strokeWidth: 2,
            },
            paddingY: 8,
        },
    },
    tooltip: {
        enabled: true,
        position: {
            anchorTo: 'pointer',
        },
    },
};

AgCharts.create(options);
