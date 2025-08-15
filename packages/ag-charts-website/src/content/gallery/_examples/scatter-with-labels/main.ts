import { AgCartesianChartOptions, AgCharts, AgScatterSeriesTooltipRendererParams } from 'ag-charts-enterprise';

import { NameData, getData } from './data';

const data = getData();

const options: AgCartesianChartOptions<NameData> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'British Baby Names: Popularity vs Trend Analysis',
    },
    subtitle: {
        text: 'Quadrant analysis reveals rising stars and established favorites',
    },
    footnote: {
        text: 'Bubble size indicates name uniqueness • Hover for details • Zoom to explore dense regions',
    },
    animation: {
        enabled: true,
        duration: 800,
    },
    series: [
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
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Popularity Index →',
            },
            nice: true,
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
            crossLines: [
                {
                    type: 'line',
                    value: 50,
                    strokeWidth: 1,
                    lineDash: [4, 4],
                    label: {
                        text: 'Average',
                        padding: 5,
                    },
                },
            ],
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Trend Score ↑',
            },
            nice: true,
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
            crossLines: [
                {
                    type: 'line',
                    value: 5,
                    strokeWidth: 1,
                    lineDash: [4, 4],
                    label: {
                        text: 'Neutral',
                        position: 'bottom-left',
                        padding: 5,
                    },
                },
            ],
        },
    ],
    legend: {
        position: 'right',
        spacing: 20,
        item: {
            marker: {
                size: 12,
                strokeWidth: 2,
            },
            label: {},
            paddingY: 8,
        },
    },
    tooltip: {
        enabled: true,
        delay: 100,
        position: {
            anchorTo: 'pointer',
        },
    },
    annotations: {
        enabled: true,
        toolbar: {
            enabled: false,
        },
    },
    initialState: {
        annotations: [
            {
                type: 'text',
                x: 93,
                y: 9.7,
                text: 'Rising Stars',
                fontStyle: 'italic',
                locked: true,
            },
            {
                type: 'text',
                x: 88,
                y: 0,
                text: 'Established Favorites',
                fontStyle: 'italic',
                locked: true,
            },
            {
                type: 'text',
                x: 0,
                y: 9.7,
                text: 'Hidden Gems',
                fontStyle: 'italic',
                locked: true,
            },
            {
                type: 'text',
                x: 0,
                y: 0,
                text: 'Fading Trends',
                fontStyle: 'italic',
                locked: true,
            },
        ],
    },
};

AgCharts.create(options);
