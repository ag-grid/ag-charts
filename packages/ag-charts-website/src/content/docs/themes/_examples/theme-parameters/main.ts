import { AgCartesianChartOptions, AgChartTheme, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const paperTheme: AgChartTheme = {
    palette: {
        fills: ['#006f9b', '#ff7faa', '#00994d', '#ff8833', '#00a0dd'],
        strokes: ['#003f58', '#934962', '#004a25', '#914d1d', '#006288'],
    },
    params: {
        foregroundColor: '#262a33',
        backgroundColor: '#fff1e5',
        accentColor: '#0d7680',
        chromeBackgroundColor: '#fff7ef',
        chromeTextColor: '#262a33',
        fontFamily: 'Georgia, serif',
        fontSize: 14,
    },
};

const oceanTheme: AgChartTheme = {
    palette: {
        fills: ['#072b6e', '#094890', '#0b6ca8', '#0c94b6', '#0bc9c9'],
        strokes: ['#051c48', '#073569', '#095686', '#097590', '#0a9999'],
    },
    params: {
        foregroundColor: '#0a54a4',
        backgroundColor: '#d9e0ed',
        accentColor: '#0ba268',
        fontFamily: 'cursive',
        fontSize: 16,
    },
};

const neonTheme: AgChartTheme = {
    palette: {
        fills: ['#00ff1e', '#ff00dd', '#00fff7', '#8f00ff', '#ff0000'],
        strokes: ['#fff'],
    },
    params: {
        foregroundColor: '#00ff1e',
        backgroundColor: '#000000',
        accentColor: '#ff00dd',
        chromeBackgroundColor: '#00ff1e',
        chromeTextColor: '#000000',
        fontFamily: 'monospace',
        fontSize: 12,
        axisColor: '#00ff1e',
        gridLineColor: '#00ff1e',
    },
};

const options: AgCartesianChartOptions = {
    theme: paperTheme,
    container: document.getElementById('myChart'),
    title: {
        text: 'Dolphins & Mirrors',
    },
    subtitle: {
        text: 'Interactions of Dolphins With Marked Mirrors',
    },
    data: getData(),
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

const chart = AgCharts.create(options);

function changeParam() {
    const foregroundColor = document.getElementById('foreground-color') as HTMLInputElement;
    const backgroundColor = document.getElementById('background-color') as HTMLInputElement;
    const accentColor = document.getElementById('accent-color') as HTMLInputElement;
    const fontFamily = document.getElementById('font-family') as HTMLInputElement;
    const fontSize = document.getElementById('font-size') as HTMLInputElement;

    (options.theme as AgChartTheme).params!.foregroundColor = foregroundColor.value;
    (options.theme as AgChartTheme).params!.backgroundColor = backgroundColor.value;
    (options.theme as AgChartTheme).params!.accentColor = accentColor.value;
    (options.theme as AgChartTheme).params!.fontFamily = fontFamily.value;
    (options.theme as AgChartTheme).params!.fontSize = Number(fontSize.value);

    chart.update(options as any);
}

function useDefaultTheme() {
    delete options.theme;
    chart.update(options);
}

function usePaperTheme() {
    options.theme = paperTheme;
    chart.update(options);
}

function useOceanTheme() {
    options.theme = oceanTheme;
    chart.update(options);
}

function useNeonTheme() {
    options.theme = neonTheme;
    chart.update(options);
}
