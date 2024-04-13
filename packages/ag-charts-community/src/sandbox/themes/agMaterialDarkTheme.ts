import { AgDefaultDarkTheme } from './agDefaultDarkTheme';

const ThemeFills = {
    Blue: '#2196f3',
    Orange: '#ff9800',
    Green: '#4caf50',
    Cyan: '#00bcd4',
    Yellow: '#ffeb3b',
    Violet: '#7e57c2',
    Gray: '#9e9e9e',
    Magenta: '#f06292',
    Brown: '#795548',
    Red: '#f44336',
};

const ThemeStrokes = {
    Blue: '#90caf9',
    Orange: '#ffcc80',
    Green: '#a5d6a7',
    Cyan: '#80deea',
    Yellow: '#fff9c4',
    Violet: '#b39ddb',
    Gray: '#e0e0e0',
    Magenta: '#f48fb1',
    Brown: '#a1887f',
    Red: '#ef9a9a',
};

export const AgMaterialDarkTheme = AgDefaultDarkTheme.createVariant('ag-material-dark', {
    'annotation:Fill': ThemeFills.Blue,
    'annotation:Stroke': ThemeStrokes.Blue,

    'palette:Fills': Object.values(ThemeFills),
    'palette:Strokes': Object.values(ThemeStrokes),

    'diverging:colorRange': [ThemeFills.Orange, ThemeFills.Yellow, ThemeFills.Green],

    'waterfall:positiveFill': ThemeFills.Blue,
    'waterfall:positiveStroke': ThemeStrokes.Blue,
    'waterfall:negativeFill': ThemeFills.Red,
    'waterfall:negativeStroke': ThemeStrokes.Red,
    'waterfall:neutralFill': ThemeFills.Gray,
    'waterfall:neutralStroke': ThemeStrokes.Gray,
});
