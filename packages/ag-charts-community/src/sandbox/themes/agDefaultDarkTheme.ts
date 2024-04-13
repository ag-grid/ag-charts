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
    labelColor: '#fff',
    'labelColor:Muted': '#7d91a0',

    'annotation:Fill': ThemeFills.Blue,
    'annotation:Stroke': ThemeStrokes.Blue,

    axisGridColor: '#545a6e',
    crossLineColor: '#fff',
    backgroundColor: '#192232',

    'palette:Fills': Object.values(ThemeFills),
    'palette:Strokes': Object.values(ThemeStrokes),

    'diverging:colorRange': [ThemeFills.Orange, ThemeFills.Yellow, ThemeFills.Green],

    'hierarchy:Fills': ['#192834', '#253746', '#324859', '#3f596c', '#4d6a80'],
    'hierarchy:Strokes': ['#192834', '#3b5164', '#496275', '#577287', '#668399'],

    'waterfall:positiveFill': ThemeFills.Blue,
    'waterfall:positiveStroke': ThemeStrokes.Blue,
    'waterfall:negativeFill': ThemeFills.Orange,
    'waterfall:negativeStroke': ThemeStrokes.Orange,
    'waterfall:neutralFill': ThemeFills.Gray,
    'waterfall:neutralStroke': ThemeStrokes.Gray,
});
