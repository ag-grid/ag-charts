import {
    AgCartesianChartOptions,
    AgChartTheme,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    ErrorBarsModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    ErrorBarsModule,
    LegendModule,
    NumberAxisModule,
    ContextMenuModule,
]);
const paperTheme: AgChartTheme = {
    palette: {
        fills: ['#006f9b', '#ff7faa', '#00994d', '#ff8833', '#00a0dd'],
        strokes: ['#003f58', '#934962', '#004a25', '#914d1d', '#006288'],
    },
    overrides: {
        common: {
            subtitle: {
                text: 'Paper Theme',
            },
        },
    },
    params: {
        foregroundColor: '#262a33',
        backgroundColor: '#fff1e5',
        accentColor: '#0d7680',
        fontFamily: [{ googleFont: 'DM Serif Text' }, 'Georgia', 'sans-serif'],
        fontSize: 14,
        tooltipBackgroundColor: '#fff7ef',
        tooltipTextColor: '#262a33',
    },
};

const oceanTheme: AgChartTheme = {
    palette: {
        fills: ['#072b6e', '#0c94b6', '#0b6ca8', '#094890', '#0bc9c9'],
        strokes: ['#051c48', '#073569', '#095686', '#097590', '#0a9999'],
    },
    overrides: {
        common: {
            subtitle: {
                text: 'Ocean Theme',
            },
        },
    },
    params: {
        foregroundColor: '#0a54a4',
        backgroundColor: '#d9e0ed',
        accentColor: '#0ba268',
        fontFamily: [{ googleFont: 'Pacifico' }, 'Savoye LET', 'cursive'],
        fontSize: 16,
    },
};

const neonTheme: AgChartTheme = {
    palette: {
        fills: ['#8f00ff', '#ff00dd', '#00ff1e', '#00fff7', '#ff0000'],
        strokes: ['#fff'],
    },
    overrides: {
        common: {
            subtitle: {
                text: 'Neon Theme',
            },
        },
    },
    params: {
        foregroundColor: '#00ff1e',
        backgroundColor: '#000000',
        accentColor: '#ff00dd',
        fontFamily: [{ googleFont: 'IBM Plex Mono' }, 'monospace'],
        fontSize: 12,
        axisColor: '#00ff1e',
        gridLineColor: '#00ff1e',
        tooltipBackgroundColor: '#00ff1e',
        tooltipTextColor: '#000000',
    },
};

const defaultTheme: AgChartTheme = {
    baseTheme: 'ag-default',
    overrides: {
        common: {
            subtitle: {
                text: 'Default Theme',
            },
        },
    },
};

const options: AgCartesianChartOptions = {
    theme: paperTheme,
    container: document.getElementById('myChart'),
    title: {
        text: 'Dolphins & Mirrors',
    },
    subtitle: {
        enabled: true,
    },
    loadGoogleFonts: true,
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
            yKeyAxis: 'ySecondary',
            legendItemName: 'Number of Looks - Transparent Mirror',
            stackGroup: 'NOL',
        },
        {
            type: 'bar',
            xKey: 'dolphin',
            yKey: 'numberOfLooksYM',
            yName: 'Number of Looks - Yellow Mirror',
            yKeyAxis: 'ySecondary',
            legendItemName: 'Number of Looks - Yellow Mirror',
            stackGroup: 'NOL',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'top',
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
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Duration of Interaction (seconds)',
            },
        },
        ySecondary: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Number of Looks',
            },
        },
    },
};

const chart = AgCharts.create(options);

function useDefaultTheme() {
    options.theme = defaultTheme;
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
