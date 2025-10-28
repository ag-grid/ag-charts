import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Dolphins & Mirrors',
    },
    subtitle: {
        text: 'Interactions of Dolphins With Marked Mirrors',
    },
    footnote: {
        text: 'Source: Marine Mammal Behavior Research Lab',
    },
    data: getData(),
    tooltip: {
        enabled: true,
        mode: 'shared',
    },
    legend: {
        position: {
            placement: 'top-right',
            floating: true,
            xOffset: -110,
            yOffset: 80,
        },
        maxWidth: 400,
        border: {
            enabled: true,
            strokeWidth: 1,
        },
        cornerRadius: 8,
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
        },
        {
            position: 'left',
            type: 'number',
            keys: ['interactionDurationTM', 'interactionDurationYM'],
            title: {
                text: 'Duration of Interaction (seconds)',
            },
            label: {
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
            },
            keys: ['numberOfLooksTM', 'numberOfLooksYM'],
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
