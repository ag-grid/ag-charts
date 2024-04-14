import { AgDefaultDarkTheme } from './agDefaultDarkTheme';

const ThemeFills = {
    Blue: '#0083ff',
    Orange: '#f60',
    Green: '#00af00',
    Cyan: '#0cf',
    Yellow: '#f7c700',
    Violet: '#ac26ff',
    Gray: '#a7a7b7',
    Magenta: '#e800c5',
    Brown: '#b54300',
    Red: '#f00',
};

const ThemeStrokes = {
    Blue: '#67b7ff',
    Orange: '#ffc24d',
    Green: '#5cc86f',
    Cyan: '#54ebff',
    Yellow: '#c18aff',
    Violet: '#fff653',
    Gray: '#aeaeae',
    Magenta: '#f078d4',
    Brown: '#ba8438',
    Red: '#ff726e',
};

export const AgVividDarkTheme = AgDefaultDarkTheme.createVariant('ag-vivid-dark', {
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
