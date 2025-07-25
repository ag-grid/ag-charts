import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Dolphins & Mirrors',
        fontSize: 20,
    },
    subtitle: {
        text: 'Interactions of Dolphins With Marked Mirrors',
        fontSize: 14,
    },
    footnote: {
        text: 'Source: Marine Mammal Behavior Research Lab',
        fontSize: 12,
        fontStyle: 'italic',
    },
    data: getData(),
    legend: {
        position: {
            placement: 'bottom-left',
            floating: true,
            xOffset: 50,
            yOffset: -15,
        },
        maxWidth: 400,
        border: {
            enabled: true,
            strokeWidth: 1,
        },
        fillOpacity: 1,
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
            type: 'bar',
            xKey: 'dolphin',
            yKey: 'interactionDurationTM',
            yName: 'Duration - Transparent',
            legendItemName: 'Duration - Transparent',
            stackGroup: 'ID',
            errorBar: {
                yLowerKey: 'interactionDurationTMLower',
                yUpperKey: 'interactionDurationTMUpper',
            },
        },
        {
            type: 'bar',
            xKey: 'dolphin',
            yKey: 'interactionDurationYM',
            yName: 'Duration - Yellow',
            legendItemName: 'Duration - Yellow',
            stackGroup: 'ID',
            errorBar: {
                yLowerKey: 'interactionDurationYMLower',
                yUpperKey: 'interactionDurationYMUpper',
            },
        },
        {
            type: 'bar',
            xKey: 'dolphin',
            yKey: 'numberOfLooksTM',
            yName: 'Looks - Transparent',
            legendItemName: 'Looks - Transparent',
            stackGroup: 'NOL',
        },
        {
            type: 'bar',
            xKey: 'dolphin',
            yKey: 'numberOfLooksYM',
            yName: 'Looks - Yellow',
            legendItemName: 'Looks - Yellow',
            stackGroup: 'NOL',
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'category',
            keys: ['dolphin'],
            title: {
                text: 'Dolphin',
                fontSize: 14,
            },
            paddingInner: 0.5,
            paddingOuter: 0.2,
            bandHighlight: {
                enabled: true,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            interval: {
                placement: 'between',
            },
            label: {
                fontSize: 12,
            },
        },
        {
            position: 'left',
            type: 'number',
            keys: ['interactionDurationTM', 'interactionDurationYM'],
            title: {
                text: 'Duration of Interaction (seconds)',
                fontSize: 14,
            },
            label: {
                fontSize: 12,
                formatter: (params) => `${params.value.toFixed(1)}s`,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
        {
            position: 'right',
            type: 'number',
            title: {
                text: 'Number of Looks',
                fontSize: 14,
            },
            keys: ['numberOfLooksTM', 'numberOfLooksYM'],
            label: {
                fontSize: 12,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    ],
};

AgCharts.create(options);
