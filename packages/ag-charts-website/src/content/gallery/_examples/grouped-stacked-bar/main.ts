import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Dolphins & Mirrors',
    },
    subtitle: {
        text: 'Interactions of Dolphins With Marked Mirrors',
    },
    data: getData(),
    theme: {
        overrides: {
            bar: {
                series: {
                    strokeWidth: 2,
                    stroke: 'transparent',
                    cornerRadius: 6,
                },
            },
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'dolphin',
            yKey: 'interactionDurationTM',
            yName: 'Interaction Duration - Transparent Mirror',
            legendItemName: 'Interaction Duration - Transparent Mirror',
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
            yName: 'Interaction Duration - Yellow Mirror',
            legendItemName: 'Interaction Duration - Yellow Mirror',
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
            yName: 'Number of Looks - Transparent Mirror',
            legendItemName: 'Number of Looks - Transparent Mirror',
            stackGroup: 'NOL',
        },
        {
            type: 'bar',
            xKey: 'dolphin',
            yKey: 'numberOfLooksYM',
            yName: 'Number of Looks - Yellow Mirror',
            legendItemName: 'Number of Looks - Yellow Mirror',
            stackGroup: 'NOL',
        },
    ],
    axes: [
        {
            position: 'top',
            type: 'category',
            keys: ['dolphin'],
            title: {
                text: 'Dolphin',
            },
            paddingInner: 0.5,
            paddingOuter: 0.2,
            crossLines: [
                {
                    type: 'range',
                    range: ['Peter', 'Peter'],
                    strokeWidth: 0,
                },
                {
                    type: 'range',
                    range: ['Mercutio', 'Mercutio'],
                    strokeWidth: 0,
                },
            ],
        },
        {
            position: 'left',
            type: 'number',
            keys: ['interactionDurationTM', 'interactionDurationYM'],
            title: {
                text: 'Duration of Interaction (seconds)',
            },
        },
        {
            position: 'right',
            type: 'number',
            title: {
                text: 'Numer of Looks',
            },
            keys: ['numberOfLooksTM', 'numberOfLooksYM'],
        },
    ],
};

AgCharts.create(options);
