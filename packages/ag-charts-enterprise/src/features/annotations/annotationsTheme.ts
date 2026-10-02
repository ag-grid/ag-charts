import {
    type AgAnnotationAxisLabel,
    type AgAnnotationHandleStyles,
    type AgAnnotationOptionsToolbar,
    type AgAnnotationsThemeableOptions,
    type AgAnnotationsToolbar,
    type AgChannelAnnotationTextStyles,
    type AgFibonacciAnnotationStyles,
    type AgLineAnnotationTextStyles,
    type AgMeasurerAnnotationStatistics,
    type AgMeasurerAnnotationStyles,
    type StrokeOptions,
    type TextOptions,
    type WithThemeParams,
} from 'ag-charts-community';
import { FONT_SIZE_RATIO } from 'ag-charts-core';

export const DEFAULT_FIBONACCI_STROKES = [
    '#797b86',
    '#e24c4a',
    '#f49d2d',
    '#65ab58',
    '#409682',
    '#4db9d2',
    '#5090dc',
    '#3068f9',
    '#e24c4a',
    '#913aac',
    '#d93e64',
];

const stroke: WithThemeParams<StrokeOptions> = {
    stroke: { $ref: 'foregroundColor' },
    strokeOpacity: 1,
    strokeWidth: 2,
};

const handle: WithThemeParams<AgAnnotationHandleStyles> = {
    fill: { $lightDark: ['#ffffff', '#192232'] },
    strokeOpacity: 1,
    strokeWidth: 2,
};

const font: WithThemeParams<TextOptions> = {
    color: { $ref: 'chartBackgroundColor' },
    fontSize: { $rem: FONT_SIZE_RATIO.LARGE },
    fontFamily: { $ref: 'fontFamily' },
};

const axisLabel: WithThemeParams<AgAnnotationAxisLabel> = {
    ...font,
    enabled: true,
    fill: { $ref: 'foregroundColor' },
    fontSize: { $ref: 'fontSize' },
};

const text = {
    ...font,
    textAlign: 'start',
};

const lineText: WithThemeParams<AgLineAnnotationTextStyles> = {
    ...font,
    position: 'top',
    alignment: 'center',
    color: { $ref: 'textColor' },
};

const channelText: WithThemeParams<AgChannelAnnotationTextStyles> = {
    ...font,
    position: 'top',
    alignment: 'center',
    color: { $ref: 'textColor' },
};

export const MEASURER_STATISTICS_THEME: WithThemeParams<AgMeasurerAnnotationStatistics> = {
    ...font,
    fontSize: { $ref: 'fontSize' },
    color: { $lightDark: ['#000', '#fff'] },
    fill: { $lightDark: ['#fafafa', '#28313e'] },
    stroke: { $lightDark: ['#ddd', '#4b525d'] },
    strokeWidth: 1,
    divider: {
        stroke: { $lightDark: ['#181d1f', '#fff'] },
        strokeWidth: 1,
        strokeOpacity: 0.5,
    },
};

export const QUICK_MEASURER_DIVIDER_THEME = { stroke: '#fff', strokeWidth: 1, strokeOpacity: 0.5 };

const background = { fill: { $ref: 'foregroundColor' }, fillOpacity: 0.075 } as const;

const fibonacci: WithThemeParams<AgFibonacciAnnotationStyles> = {
    ...stroke,
    strokes: { $shallowSimple: DEFAULT_FIBONACCI_STROKES },
    rangeStroke: { $ref: 'foregroundColor' },
    handle: { ...handle },
    text: { ...lineText, position: 'center' },
    label: {
        ...font,
        color: undefined,
        fontSize: { $rem: FONT_SIZE_RATIO.SMALLER },
    },
};

const measurer: WithThemeParams<AgMeasurerAnnotationStyles> = {
    ...stroke,
    background: { ...background },
    handle: { ...handle },
    text: { ...lineText },
    statistics: { ...MEASURER_STATISTICS_THEME },
};

const toolbar: WithThemeParams<AgAnnotationsToolbar> = {
    buttons: {
        $shallowSimple: [
            {
                icon: 'text-annotation',
                tooltip: 'toolbarAnnotationsTextAnnotations',
                value: 'text-menu',
            },
            {
                icon: 'trend-line-drawing',
                tooltip: 'toolbarAnnotationsLineAnnotations',
                value: 'line-menu',
            },
            {
                icon: 'arrow-drawing',
                tooltip: 'toolbarAnnotationsShapeAnnotations',
                value: 'shape-menu',
            },
            {
                icon: 'delete',
                tooltip: 'toolbarAnnotationsClearAll',
                value: 'clear',
            },
        ],
    },
    padding: { $ref: 'chartPadding' },
};

const optionsToolbar: WithThemeParams<AgAnnotationOptionsToolbar> = {
    buttons: {
        $shallowSimple: [
            {
                icon: 'text-annotation',
                tooltip: 'toolbarAnnotationsTextColor',
                value: 'text-color',
            },
            {
                icon: 'line-color',
                tooltip: 'toolbarAnnotationsLineColor',
                value: 'line-color',
            },
            {
                icon: 'fill-color',
                tooltip: 'toolbarAnnotationsFillColor',
                value: 'fill-color',
            },
            {
                tooltip: 'toolbarAnnotationsTextSize',
                value: 'text-size',
            },
            {
                tooltip: 'toolbarAnnotationsLineStrokeWidth',
                value: 'line-stroke-width',
            },
            {
                icon: 'line-style-solid',
                tooltip: 'toolbarAnnotationsLineStyle',
                value: 'line-style-type',
            },
            {
                icon: 'settings',
                tooltip: 'toolbarAnnotationsSettings',
                value: 'settings',
            },
            {
                type: 'switch',
                icon: 'unlocked',
                tooltip: 'toolbarAnnotationsLock',
                ariaLabel: 'toolbarAnnotationsLock',
                checkedOverrides: {
                    icon: 'locked',
                    tooltip: 'toolbarAnnotationsUnlock',
                },
                value: 'lock',
            },
            {
                icon: 'delete',
                tooltip: 'toolbarAnnotationsDelete',
                value: 'delete',
            },
        ],
    },
};

export const annotationsTheme: WithThemeParams<AgAnnotationsThemeableOptions> = {
    enabled: false,

    // Lines
    line: {
        ...stroke,
        handle: { ...handle },
        text: { ...lineText },
    },
    'horizontal-line': {
        ...stroke,
        handle: { ...handle },
        axisLabel: { ...axisLabel },
        text: { ...lineText },
    },
    'vertical-line': {
        ...stroke,
        handle: { ...handle },
        axisLabel: { ...axisLabel },
        text: { ...lineText },
    },

    // Channels
    'disjoint-channel': {
        ...stroke,
        background: { ...background },
        handle: { ...handle },
        text: { ...channelText },
    },
    'parallel-channel': {
        ...stroke,
        middle: {
            lineDash: [6, 5],
            strokeWidth: 1,
        },
        background: { ...background },
        handle: { ...handle },
        text: { ...channelText },
    },

    // Fibonnaccis
    'fibonacci-retracement': { ...fibonacci },

    'fibonacci-retracement-trend-based': { ...fibonacci },

    // Texts
    callout: {
        ...stroke,
        ...text,
        color: { $ref: 'textColor' },
        handle: { ...handle },
        fill: { $ref: 'foregroundColor' },
        fillOpacity: 0.075,
    },
    comment: {
        ...text,
        fontWeight: 700,
        handle: { ...handle },
        fill: { $ref: 'foregroundColor' },
    },
    note: {
        ...text,
        color: { $lightDark: ['#000', '#fff'] },
        fill: { $ref: 'annotationColor' },
        stroke: { $ref: 'chartBackgroundColor' },
        strokeWidth: 1,
        strokeOpacity: 1,
        handle: { ...handle },
        background: {
            fill: { $lightDark: ['#fafafa', '#28313e'] },
            stroke: { $lightDark: ['#ddd', '#4b525d'] },
            strokeWidth: 1,
        },
    },
    text: {
        ...text,
        color: { $ref: 'textColor' },
        handle: { ...handle },
    },

    // Shapes
    arrow: {
        ...stroke,
        handle: { ...handle },
        text: { ...lineText },
    },
    'arrow-up': {
        fill: { $palette: 'up.fill' },
        handle: { ...handle, stroke: { $ref: 'foregroundColor' } },
    },
    'arrow-down': {
        fill: { $palette: 'down.fill' },
        handle: { ...handle, stroke: { $ref: 'foregroundColor' } },
    },

    // Measurers
    'date-range': {
        ...measurer,
    },
    'price-range': {
        ...measurer,
    },
    'date-price-range': {
        ...measurer,
    },
    'quick-date-price-range': {
        up: {
            ...stroke,
            fill: { $ref: 'annotationColor' },
            fillOpacity: 0.2,
            handle: { ...handle },
            statistics: {
                ...MEASURER_STATISTICS_THEME,
                color: '#fff',
                fill: { $ref: 'annotationColor' },
                strokeWidth: 0,
                divider: { ...QUICK_MEASURER_DIVIDER_THEME },
            },
        },
        down: {
            ...stroke,
            stroke: '#e35c5c',
            fill: '#e35c5c',
            fillOpacity: 0.2,
            handle: {
                ...handle,
                stroke: '#e35c5c',
            },
            statistics: {
                ...MEASURER_STATISTICS_THEME,
                color: '#fff',
                fill: '#e35c5c',
                strokeWidth: 0,
                divider: { ...QUICK_MEASURER_DIVIDER_THEME },
            },
        },
    },

    axesButtons: {},
    // Toolbars
    toolbar,
    optionsToolbar,
};
