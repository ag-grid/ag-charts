import { AgDefaultTheme } from './agDefaultTheme';

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
    Blue: '#0f68c0',
    Orange: '#d47100',
    Green: '#007922',
    Cyan: '#009ac2',
    Yellow: '#bca400',
    Violet: '#753cac',
    Gray: '#646464',
    Magenta: '#9b2685',
    Brown: '#6c3b00',
    Red: '#cb0021',
};

export const AgVividTheme = AgDefaultTheme.createVariant('ag-vivid', {
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
