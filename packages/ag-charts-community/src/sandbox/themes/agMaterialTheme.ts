import { AgDefaultTheme } from './agDefaultTheme';

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
    Blue: '#1565c0',
    Orange: '#e65100',
    Green: '#2e7d32',
    Cyan: '#00838f',
    Yellow: '#f9a825',
    Violet: '#4527a0',
    Gray: '#616161',
    Magenta: '#c2185b',
    Brown: '#4e342e',
    Red: '#b71c1c',
};

export const AgMaterialTheme = AgDefaultTheme.createVariant('ag-material', {
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
