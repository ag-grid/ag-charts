import { AgDefaultTheme } from './agDefaultTheme';

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
    Blue: '#2346c9',
    Purple: '#7653d4',
    Magenta: '#a73da9',
    Pink: '#c32d66',
    Red: '#c84b1c',
    Orange: '#c87f00',
    Yellow: '#c1b900',
    Green: '#008c1c',
    Cyan: '#00927c',
    ModerateBlue: '#0087bb',
};

export const AgPolychromaTheme = AgDefaultTheme.createVariant('ag-polychroma', {
    'annotation:fill': ThemeFills.Blue,
    'annotation:stroke': ThemeStrokes.Blue,

    'palette:fills': Object.values(ThemeFills),
    'palette:strokes': Object.values(ThemeStrokes),

    'diverging:colorRange': [ThemeFills.Blue, ThemeFills.Red],

    'waterfall:positiveFill': ThemeFills.Blue,
    'waterfall:positiveStroke': ThemeStrokes.Blue,
    'waterfall:negativeFill': ThemeFills.Red,
    'waterfall:negativeStroke': ThemeStrokes.Red,
    'waterfall:neutralFill': '#bbb',
    'waterfall:neutralStroke': '#888',
});
