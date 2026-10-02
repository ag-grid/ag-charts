import { FONT_SIZE_RATIO } from 'ag-charts-core';
import type {
    AgAnnotationAxisLabel,
    AgAnnotationHandleStyles,
    AgAnnotationsThemeableOptions,
    AgFibonacciAnnotationStyles,
    AgMeasurerAnnotationStyles,
    StrokeOptions,
    TextOptions,
    WithThemeParams,
} from 'ag-charts-types';

import {
    ANNOTATION_HANDLE_FILL,
    ANNOTATION_TEXTBOX_COLOR,
    ANNOTATION_TEXTBOX_FILL,
    ANNOTATION_TEXTBOX_STROKE,
    DEFAULT_FIBONACCI_STROKES,
    MEASURER_STATISTICS_THEME,
    QUICK_MEASURER_DIVIDER_THEME,
} from '../../features/annotations/annotationsTheme';

const stroke: WithThemeParams<StrokeOptions> = {
    stroke: { $ref: 'annotationColor' },
};

const handle: WithThemeParams<AgAnnotationHandleStyles> = {
    fill: ANNOTATION_HANDLE_FILL,
};

const axisLabel: WithThemeParams<AgAnnotationAxisLabel> = {
    color: 'white',
    fill: { $ref: 'annotationColor' },
};

const lineText: WithThemeParams<TextOptions> = {
    color: { $ref: 'annotationColor' },
};

const font: WithThemeParams<TextOptions> = {
    color: { $lightDark: ['#5090dc', '#fff'] },
    fontSize: { $rem: FONT_SIZE_RATIO.LARGE },
    fontFamily: { $ref: 'fontFamily' },
};

const background = { fill: { $ref: 'annotationColor' }, fillOpacity: 0.2 } as const;

const fibonacci: WithThemeParams<AgFibonacciAnnotationStyles> = {
    ...stroke,
    strokes: { $shallowSimple: DEFAULT_FIBONACCI_STROKES },
    rangeStroke: { $ref: 'annotationColor' },
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

export const annotationsTheme: WithThemeParams<AgAnnotationsThemeableOptions> = {
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
        text: { ...lineText },
    },
    'parallel-channel': {
        ...stroke,
        background: { ...background },
        handle: { ...handle },
        text: { ...lineText },
    },

    // Fibonnaccis
    'fibonacci-retracement': { ...fibonacci },

    'fibonacci-retracement-trend-based': { ...fibonacci },

    // Texts
    callout: {
        ...stroke,
        ...font,
        color: { $ref: 'textColor' },
        handle: { ...handle },
        fill: { $ref: 'annotationColor' },
        fillOpacity: 0.2,
    },
    comment: {
        ...font,
        color: 'white',
        fontWeight: 700,
        handle: { ...handle },
        fill: { $ref: 'annotationColor' },
    },
    note: {
        ...font,
        color: ANNOTATION_TEXTBOX_COLOR,
        fill: { $ref: 'annotationColor' },
        stroke: { $ref: 'chartBackgroundColor' },
        strokeWidth: 1,
        strokeOpacity: 1,
        handle: { ...handle },
        background: {
            fill: ANNOTATION_TEXTBOX_FILL,
            stroke: ANNOTATION_TEXTBOX_STROKE,
            strokeWidth: 1,
        },
    },
    text: {
        ...font,
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
        handle: { ...handle, stroke: { $ref: 'annotationColor' } },
    },
    'arrow-down': {
        fill: { $palette: 'down.fill' },
        handle: { ...handle, stroke: { $ref: 'annotationColor' } },
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
    axesButtons: {
        enabled: true,
    },
};
