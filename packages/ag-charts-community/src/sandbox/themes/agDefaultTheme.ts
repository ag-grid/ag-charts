/* eslint-disable sonarjs/no-duplicate-string */
import { ThemeDefinition } from './themeDefinition';
import { ThemeVariables } from './themeVariables';

const ThemeFills = {
    Blue: '#5090dc',
    Orange: '#ffa03a',
    Green: '#459d55',
    Cyan: '#34bfe1',
    Yellow: '#e1cc00',
    Violet: '#9669cb',
    Gray: '#b5b5b5',
    Magenta: '#bd5aa7',
    Brown: '#8a6224',
    Red: '#ef5452',
};

const ThemeStrokes = {
    Blue: '#2b5c95',
    Orange: '#cc6f10',
    Green: '#1e652e',
    Cyan: '#18859e',
    Yellow: '#a69400',
    Violet: '#603c88',
    Gray: '#575757',
    Magenta: '#7d2f6d',
    Brown: '#4f3508',
    Red: '#a82529',
};

export const themeVars = new ThemeVariables({
    'font:family': 'Verdana, sans-serif',

    'font:sizeSmall': 12,
    'font:sizeMedium': 13,
    'font:sizeLarge': 17,

    'text:color': '#464646',
    'text:invertColor': '#fff',
    'text:mutedColor': '#8c8c8c',

    'background:color': '#fff',
    'shadow:color': '#00000080',

    'axis:gridColor': '#e0eaf1',
    'axis:lineColor': '#c3c3c3',

    'hierarchy:fills': ['#fff', '#e0e5ea', '#c1ccd5', '#a3b4c1', '#859cad'],
    'hierarchy:strokes': ['#fff', '#c5cbd1', '#a4b1bd', '#8498a9', '#648096'],

    'annotation:fill': ThemeFills.Blue,
    'annotation:stroke': ThemeStrokes.Blue,

    'palette:fills': Object.values(ThemeFills),
    'palette:strokes': Object.values(ThemeStrokes),

    'diverging:colorRange': [ThemeFills.Orange, ThemeFills.Yellow, ThemeFills.Green],

    'waterfall:positiveFill': ThemeFills.Blue,
    'waterfall:positiveStroke': ThemeStrokes.Blue,
    'waterfall:negativeFill': ThemeFills.Orange,
    'waterfall:negativeStroke': ThemeStrokes.Orange,
    'waterfall:neutralFill': ThemeFills.Gray,
    'waterfall:neutralStroke': ThemeStrokes.Gray,
});

export const AgDefaultTheme = new ThemeDefinition('ag-default', themeVars, {
    chart: {
        allowEmpty: false,
        padding: [20],
        title: {
            enabled: false,
            text: 'Title',
            color: themeVars.use('text:color'),
            fontSize: themeVars.use('font:sizeLarge'),
            fontFamily: themeVars.use('font:family'),
            wrapping: 'hyphenate',
        },
        subtitle: {
            enabled: false,
            text: 'Subtitle',
            color: themeVars.use('text:mutedColor'),
            fontSize: themeVars.use('font:sizeMedium'),
            fontFamily: themeVars.use('font:family'),
            wrapping: 'hyphenate',
            indent: 20,
        },
        footnote: {
            enabled: false,
            text: 'Footnote',
            color: themeVars.use('text:mutedColor'),
            fontSize: themeVars.use('font:sizeMedium'),
            fontFamily: themeVars.use('font:family'),
            wrapping: 'hyphenate',
            indent: 20,
        },
        tooltip: {
            enabled: true,
            range: 'nearest',
            delay: 0,
        },
        legend: {
            enabled: true,
            position: 'bottom',
            padding: [30],
            item: {
                padding: [8, 16],
                marker: { size: 15, padding: [8] },
                label: {
                    color: themeVars.use('text:color'),
                    fontSize: themeVars.use('font:sizeSmall'),
                    fontFamily: themeVars.use('font:family'),
                },
            },
            pagination: {},
        },
        background: {
            enabled: true,
            fill: '#fff',
        },
    },
    axis: {
        title: {
            enabled: false,
            text: 'Axis Title',
            color: themeVars.use('text:color'),
            fontSize: themeVars.use('font:sizeMedium'),
            fontFamily: themeVars.use('font:family'),
            indent: 25,
        },
        label: {
            padding: [5],
            color: themeVars.use('text:color'),
            fontSize: themeVars.use('font:sizeSmall'),
            fontFamily: themeVars.use('font:family'),
            avoidCollisions: true,
        },
        line: { enabled: true, thickness: 1, color: themeVars.use('axis:lineColor') },
        tick: { enabled: true, thickness: 1, color: themeVars.use('axis:lineColor') },
        gridLine: { enabled: true, style: [{ stroke: themeVars.use('axis:gridColor'), lineDash: [] }] },

        // should be in a separate module
        crossLines: {
            enabled: false,
            fill: themeVars.use('text:color'),
            stroke: themeVars.use('text:color'),
            fillOpacity: 0.1,
            strokeWidth: 1,
            label: {
                enabled: false,
                padding: [5],
                color: themeVars.use('text:color'),
                fontSize: themeVars.use('font:sizeSmall'),
                fontFamily: themeVars.use('font:family'),
            },
        },
    },
    series: {
        visible: true,
        showInLegend: true,
        tooltip: { enabled: true },
        highlightStyle: {
            item: { fill: '#ffffff54', stroke: `#0006`, strokeWidth: 2 },
            series: { dimOpacity: 1 },
            text: { color: 'black' },
        },
        nodeClickRange: 'exact',
    },
});
