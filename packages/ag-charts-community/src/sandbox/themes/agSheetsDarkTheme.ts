import { AgDefaultDarkTheme } from './agDefaultDarkTheme';

const ThemeFills = {
    Blue: '#4472c4',
    Orange: '#ed7d31',
    Gray: '#a5a5a5',
    Yellow: '#ffc000',
    ModerateBlue: '#5b9bd5',
    Green: '#70ad47',
    DarkGray: '#7b7b7b',
    DarkBlue: '#264478',
    VeryDark_gray: '#636363',
    DarkYellow: '#997300',
};

const ThemeStrokes = {
    Blue: '#6899ee',
    Orange: '#ffa55d',
    Gray: '#cdcdcd',
    Yellow: '#ffea53',
    ModerateBlue: '#82c3ff',
    Green: '#96d56f',
    DarkGray: '#a1a1a1',
    DarkBlue: '#47689f',
    VeryDark_gray: '#878787',
    DarkYellow: '#c0993d',
};

export const AgSheetsDarkTheme = AgDefaultDarkTheme.createVariant('ag-sheets-dark', {
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
