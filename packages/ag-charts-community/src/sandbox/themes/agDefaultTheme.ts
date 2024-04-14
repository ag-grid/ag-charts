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
    fontFamily: 'Verdana, sans-serif',

    'fontSize:Small': 12,
    'fontSize:Medium': 13,
    'fontSize:Large': 17,

    labelColor: '#464646',
    'labelColor:Invert': '#fff',
    'labelColor:Muted': '#8c8c8c',

    axisGridColor: '#e0eaf1',
    axisLineColor: '#c3c3c3',
    crossLineColor: '#464646',
    backgroundColor: '#fff',
    shadowColor: '#00000080',

    'hierarchy:Fills': ['#fff', '#e0e5ea', '#c1ccd5', '#a3b4c1', '#859cad'],
    'hierarchy:Strokes': ['#fff', '#c5cbd1', '#a4b1bd', '#8498a9', '#648096'],

    'annotation:Fill': ThemeFills.Blue,
    'annotation:Stroke': ThemeStrokes.Blue,

    'palette:Fills': Object.values(ThemeFills),
    'palette:Strokes': Object.values(ThemeStrokes),

    'diverging:colorRange': [ThemeFills.Orange, ThemeFills.Yellow, ThemeFills.Green],

    'waterfall:positiveFill': ThemeFills.Blue,
    'waterfall:positiveStroke': ThemeStrokes.Blue,
    'waterfall:negativeFill': ThemeFills.Orange,
    'waterfall:negativeStroke': ThemeStrokes.Orange,
    'waterfall:neutralFill': ThemeFills.Gray,
    'waterfall:neutralStroke': ThemeStrokes.Gray,
});

export const AgDefaultTheme = new ThemeDefinition('ag-default', themeVars, {
    stage: {
        allowEmpty: false,
        padding: [20],
        title: {
            enabled: false,
            text: 'Title',
            color: themeVars.use('labelColor'),
            fontSize: themeVars.use('fontSize:Large'),
            fontFamily: themeVars.use('fontFamily'),
            wrapping: 'hyphenate',
        },
        subtitle: {
            enabled: false,
            text: 'Subtitle',
            color: themeVars.use('labelColor:Muted'),
            fontSize: themeVars.use('fontSize:Medium'),
            fontFamily: themeVars.use('fontFamily'),
            wrapping: 'hyphenate',
            indent: 20,
        },
        footnote: {
            enabled: false,
            text: 'Footnote',
            color: themeVars.use('labelColor:Muted'),
            fontSize: themeVars.use('fontSize:Medium'),
            fontFamily: themeVars.use('fontFamily'),
            wrapping: 'hyphenate',
            indent: 20,
        },
        legend: {
            enabled: true,
            position: 'bottom',
            padding: [30],
            item: {
                padding: [8, 16],
                marker: { size: 15, padding: [8] },
                label: {
                    color: themeVars.use('labelColor'),
                    fontSize: themeVars.use('fontSize:Small'),
                    fontFamily: themeVars.use('fontFamily'),
                },
            },
            pagination: {},
        },
        background: {
            enabled: true,
            fill: '#fff',
        },
    },
    axes: {},
    tooltip: {
        enabled: true,
        range: 'nearest',
        delay: 0,
    },
});
