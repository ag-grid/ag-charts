/* eslint-disable sonarjs/no-duplicate-string */
import { CARTESIAN_AXIS_TYPE, POLAR_AXIS_TYPE } from '../../chart/themes/constants';
import { DEFAULT_CROSS_LINES_COLOUR } from '../../chart/themes/symbols';
import { ThemeDefinition } from './themeDefinition';
import { ThemeVariables } from './themeVariables';

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

export const themeVars = new ThemeVariables({
    isDarkTheme: false, // TODO remove from theme vars, should be on theme def

    'font:family': 'Verdana, sans-serif',

    'font:sizeSmall': 12,
    'font:sizeMedium': 13,
    'font:sizeLarge': 17,

    'text:color': '#464646',
    'text:invertColor': '#fff',
    'text:mutedColor': '#8c8c8c',

    'background:color': '#fff',
    'shadow:color': '#00000080',

    'axis:gridColor': '#e0eaf1',
    'axis:lineColor': '#c3c3c3',

    'hierarchy:fills': ['#fff', '#e0e5ea', '#c1ccd5', '#a3b4c1', '#859cad'],
    'hierarchy:strokes': ['#fff', '#c5cbd1', '#a4b1bd', '#8498a9', '#648096'],

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

export const AgDefaultTheme = new ThemeDefinition('ag-default', themeVars, {
    minWidth: 300,
    minHeight: 300,
    padding: { top: 20, right: 20, bottom: 20, left: 20 },

    title: {
        enabled: false,
        text: 'Title',
        color: themeVars.use('text:color'),
        fontFamily: themeVars.use('font:family'),
        fontSize: themeVars.use('font:sizeLarge'),
        wrapping: 'hyphenate',
    },
    subtitle: {
        enabled: false,
        text: 'Subtitle',
        color: themeVars.use('text:mutedColor'),
        fontFamily: themeVars.use('font:family'),
        fontSize: themeVars.use('font:sizeMedium'),
        wrapping: 'hyphenate',
        spacing: 20,
    },
    footnote: {
        enabled: false,
        text: 'Footnote',
        color: themeVars.use('text:mutedColor'),
        fontFamily: themeVars.use('font:family'),
        fontSize: themeVars.use('font:sizeMedium'),
        wrapping: 'hyphenate',
        spacing: 20,
    },

    legend: {
        position: 'bottom',
        reverseOrder: false,
        spacing: 30,
        listeners: {},
        item: {
            paddingX: 16,
            paddingY: 8,
            marker: { size: 15, padding: 8 },
            toggleSeriesVisible: true,
            label: {
                color: themeVars.use('text:color'),
                fontFamily: themeVars.use('font:family'),
                fontSize: themeVars.use('font:sizeSmall'),
            },
        },
        pagination: {
            marker: { size: 12 },
            label: { color: themeVars.use('text:color') },
            activeStyle: { fill: themeVars.use('text:color') },
            highlightStyle: { fill: themeVars.use('text:color') },
            inactiveStyle: { fill: themeVars.use('text:mutedColor') },
        },
    },

    tooltip: {
        enabled: true,
        darkTheme: themeVars.use('isDarkTheme'),
        range: 'nearest',
        delay: 0,
    },

    overlays: {
        loading: { darkTheme: themeVars.use('isDarkTheme') },
        noData: { darkTheme: themeVars.use('isDarkTheme') },
        noVisibleSeries: { darkTheme: themeVars.use('isDarkTheme') },
    },

    background: {
        visible: true,
        fill: themeVars.use('background:color'),
    },

    keyboard: { enabled: true },

    overrides: {
        common: {
            axes: {
                common: {
                    title: {
                        enabled: false,
                        text: 'Axis Title',
                        spacing: 25,
                        color: themeVars.use('text:color'),
                        fontFamily: themeVars.use('font:family'),
                        fontSize: themeVars.use('font:sizeSmall'),
                    },
                    label: {
                        padding: 5,
                        avoidCollisions: true,
                        color: themeVars.use('text:color'),
                        fontFamily: themeVars.use('font:family'),
                        fontSize: themeVars.use('font:sizeSmall'),
                    },
                    line: {
                        enabled: true,
                        width: 1,
                        color: themeVars.use('axis:lineColor'),
                    },
                    tick: {
                        enabled: false,
                        width: 1,
                        color: themeVars.use('axis:lineColor'),
                    },
                    gridLine: {
                        enabled: true,
                        style: [
                            {
                                stroke: themeVars.use('axis:gridColor'),
                                lineDash: [],
                            },
                        ],
                    },
                    crossLines: {
                        enabled: false,
                        fill: DEFAULT_CROSS_LINES_COLOUR,
                        stroke: DEFAULT_CROSS_LINES_COLOUR,
                        fillOpacity: 0.1,
                        strokeWidth: 1,
                        label: {
                            enabled: false,
                            padding: 5,
                            color: themeVars.use('text:color'),
                            fontFamily: themeVars.use('font:family'),
                            fontSize: themeVars.use('font:sizeSmall'),
                        },
                    },
                },
                [CARTESIAN_AXIS_TYPE.NUMBER]: { line: { enabled: false } },
                [CARTESIAN_AXIS_TYPE.LOG]: { base: 10, line: { enabled: false } },
                [CARTESIAN_AXIS_TYPE.TIME]: { gridLine: { enabled: false } },
                [CARTESIAN_AXIS_TYPE.CATEGORY]: {
                    groupPaddingInner: 0.1,
                    label: { autoRotate: true },
                    gridLine: { enabled: false },
                },
                [POLAR_AXIS_TYPE.ANGLE_CATEGORY]: { gridLine: { enabled: false } },
                [POLAR_AXIS_TYPE.ANGLE_NUMBER]: { gridLine: { enabled: false } },
                [POLAR_AXIS_TYPE.RADIUS_CATEGORY]: {
                    line: { enabled: false },
                    tick: { enabled: false },
                },
                [POLAR_AXIS_TYPE.RADIUS_NUMBER]: {
                    line: { enabled: false },
                    tick: { enabled: false },
                },
            },
        },
    },
});
