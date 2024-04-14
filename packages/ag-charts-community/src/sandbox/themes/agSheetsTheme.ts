import { AgDefaultTheme } from './agDefaultTheme';

const ThemeFills = {
    Blue: '#5281d5',
    Orange: '#ff8d44',
    Gray: '#b5b5b5',
    Yellow: '#ffd02f',
    ModerateBlue: '#6aabe6',
    Green: '#7fbd57',
    DarkGray: '#8a8a8a',
    DarkBlue: '#335287',
    VeryDark_gray: '#717171',
    DarkYellow: '#a98220',
};

const ThemeStrokes = {
    Blue: '#214d9b',
    Orange: '#c25600',
    Gray: '#7f7f7f',
    Yellow: '#d59800',
    ModerateBlue: '#3575ac',
    Green: '#4b861a',
    DarkGray: '#575757',
    DarkBlue: '#062253',
    VeryDark_gray: '#414141',
    DarkYellow: '#734f00',
};

export const AgSheetsTheme = AgDefaultTheme.createVariant('ag-sheets', {
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
