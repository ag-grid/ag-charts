import { AgDefaultTheme } from './agDefaultTheme';

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

export const AgDefaultDarkTheme = AgDefaultTheme.createVariant('ag-default-dark', {
    'label:color': '#fff',
    'label:mutedColor': '#7d91a0',

    'annotation:fill': ThemeFills.Blue,
    'annotation:stroke': ThemeStrokes.Blue,

    'axisGrid:color': '#545a6e',
    'crossLine:color': '#fff',
    'background:color': '#192232',

    'palette:fills': Object.values(ThemeFills),
    'palette:strokes': Object.values(ThemeStrokes),

    'diverging:colorRange': [ThemeFills.Orange, ThemeFills.Yellow, ThemeFills.Green],

    'hierarchy:fills': ['#192834', '#253746', '#324859', '#3f596c', '#4d6a80'],
    'hierarchy:strokes': ['#192834', '#3b5164', '#496275', '#577287', '#668399'],

    'waterfall:positiveFill': ThemeFills.Blue,
    'waterfall:positiveStroke': ThemeStrokes.Blue,
    'waterfall:negativeFill': ThemeFills.Orange,
    'waterfall:negativeStroke': ThemeStrokes.Orange,
    'waterfall:neutralFill': ThemeFills.Gray,
    'waterfall:neutralStroke': ThemeStrokes.Gray,
});
