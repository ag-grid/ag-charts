import { AgDefaultDarkTheme } from './agDefaultDarkTheme';

const ThemeFills = {
    Blue: '#436ff4',
    Purple: '#9a7bff',
    Magenta: '#d165d2',
    Pink: '#f0598b',
    Red: '#f47348',
    Orange: '#f2a602',
    Yellow: '#e9e201',
    Green: '#21b448',
    Cyan: '#00b9a2',
    ModerateBlue: '#00aee4',
};

const ThemeStrokes = {
    Blue: '#6698ff',
    Purple: '#c0a3ff',
    Magenta: '#fc8dfc',
    Pink: '#ff82b1',
    Red: '#ff9b70',
    Orange: '#ffcf4e',
    Yellow: '#ffff58',
    Green: '#58dd70',
    Cyan: '#51e2c9',
    ModerateBlue: '#4fd7ff',
};

export const AgPolychromaDarkTheme = AgDefaultDarkTheme.createVariant('ag-polychroma-dark', {
    'annotation:Fill': ThemeFills.Blue,
    'annotation:Stroke': ThemeStrokes.Blue,

    'palette:Fills': Object.values(ThemeFills),
    'palette:Strokes': Object.values(ThemeStrokes),

    'diverging:colorRange': [ThemeFills.Blue, ThemeFills.Red],

    'waterfall:positiveFill': ThemeFills.Blue,
    'waterfall:positiveStroke': ThemeStrokes.Blue,
    'waterfall:negativeFill': ThemeFills.Red,
    'waterfall:negativeStroke': ThemeStrokes.Red,
    'waterfall:neutralFill': '#bbb',
    'waterfall:neutralStroke': '#eee',
});
