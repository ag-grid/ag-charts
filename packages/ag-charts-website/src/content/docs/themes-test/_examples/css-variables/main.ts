import {
    AgCartesianChartOptions,
    AgChartTheme,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrossLinesModule,
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
    CrossLinesModule,
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
        // foregroundColor: { ref: 'accentColor', mix: 0.8, onto: 'tooltipTextColor' },
        // foregroundColor: { ref: 'accentColor', mix: 0.9 },
        // foregroundColor: 'red',
        // foregroundColor: { ref: 'var(--ag-charts-accent-color)' },
        // foregroundColor: { ref: 'var(--custom-variable)' },
        fontSize: 14,
        tooltipBackgroundColor: '#fff7ef',
        tooltipTextColor: '#262a33',
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
        color: 'var(--ag-charts-accent-color)',
    },
    subtitle: {
        enabled: true,
        color: 'var(--custom-variable)',
    },
    animation: { enabled: false },
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
            fill: 'var(--custom-variable-2)',
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
                color: 'var(--custom-variable)',
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

function changeCSSVariable() {
    document.body.style.setProperty(
        '--custom-variable',
        document.body.style.getPropertyValue('--custom-variable') === 'blue' ? 'red' : 'blue'
    );
    document.body.style.setProperty(
        '--custom-variable-2',
        document.body.style.getPropertyValue('--custom-variable-2') === 'purple' ? 'yellow' : 'purple'
    );
    document.body.style.setProperty(
        '--custom-variable-3',
        document.body.style.getPropertyValue('--custom-variable-3') === 'green' ? 'orange' : 'green'
    );
    (options.title as any).color = 'var(--custom-variable-3)';
    chart.update(options);
}
