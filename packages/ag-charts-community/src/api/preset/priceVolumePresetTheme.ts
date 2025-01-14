import { _ModuleSupport } from 'ag-charts-community';
import type { AgAnnotationsThemeableOptions, WithThemeParams } from 'ag-charts-types';

const { ThemeSymbols } = _ModuleSupport;

const stroke = {
    stroke: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
};

const handle = {
    fill: ThemeSymbols.DEFAULT_ANNOTATION_HANDLE_FILL,
};

const axisLabel = {
    fill: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
};

const lineText = {
    color: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
};

const font = {
    color: ThemeSymbols.DEFAULT_TEXT_ANNOTATION_COLOR,
    fontSize: 14,
    fontFamily: { ref: 'fontFamily' as const },
};

const text = {
    ...font,
    color: ThemeSymbols.DEFAULT_TEXT_ANNOTATION_COLOR,
    textAlign: 'left',
};

const measurerStatistics = {
    ...font,
    fontSize: { ref: 'fontSize' as const },
    color: ThemeSymbols.DEFAULT_ANNOTATION_STATISTICS_COLOR,
    fill: ThemeSymbols.DEFAULT_ANNOTATION_STATISTICS_FILL,
    stroke: ThemeSymbols.DEFAULT_ANNOTATION_STATISTICS_STROKE,
    strokeWidth: 1,
    divider: {
        stroke: ThemeSymbols.DEFAULT_ANNOTATION_STATISTICS_DIVIDER_STROKE,
        strokeWidth: 1,
        strokeOpacity: 0.5,
    },
};

const measurer = {
    ...stroke,
    background: {
        fill: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
        fillOpacity: 0.2,
    },
    handle: { ...handle },
    text: { ...lineText },
    statistics: { ...measurerStatistics },
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
        background: {
            fill: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
            fillOpacity: 0.2,
        },
        handle: { ...handle },
        text: { ...lineText },
    },
    'parallel-channel': {
        ...stroke,
        background: {
            fill: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
            fillOpacity: 0.2,
        },
        handle: { ...handle },
        text: { ...lineText },
    },

    // Fibonnaccis
    'fibonacci-retracement': {
        ...stroke,
        strokes: ThemeSymbols.DEFAULT_FIBONACCI_STROKES as unknown as string[],
        rangeStroke: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
        handle: { ...handle },
        text: { ...lineText, position: 'center' },
        label: { ...font, color: undefined, fontSize: 10 },
    },

    'fibonacci-retracement-trend-based': {
        ...stroke,
        strokes: ThemeSymbols.DEFAULT_FIBONACCI_STROKES as unknown as string[],
        rangeStroke: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
        handle: { ...handle },
        text: { ...lineText, position: 'center' },
        label: { ...font, color: undefined, fontSize: 10 },
    },

    // Texts
    callout: {
        ...stroke,
        ...text,
        color: { ref: 'foregroundColor' },
        handle: { ...handle },
        fill: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
        fillOpacity: 0.2,
    },
    comment: {
        ...text,
        color: 'white',
        fontWeight: 700,
        handle: { ...handle },
        fill: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    },
    note: {
        ...text,
        color: ThemeSymbols.DEFAULT_TEXTBOX_COLOR,
        fill: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
        stroke: { ref: 'backgroundColor' },
        strokeWidth: 1,
        strokeOpacity: 1,
        handle: { ...handle },
        background: {
            fill: ThemeSymbols.DEFAULT_TEXTBOX_FILL,
            stroke: ThemeSymbols.DEFAULT_TEXTBOX_STROKE,
            strokeWidth: 1,
        },
    },
    text: {
        ...text,
        handle: { ...handle },
    },

    // Shapes
    arrow: {
        ...stroke,
        handle: { ...handle },
        text: { ...lineText },
    },
    'arrow-up': {
        fill: ThemeSymbols.PALETTE_UP_FILL,
        handle: { ...handle, stroke: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR },
    },
    'arrow-down': {
        fill: ThemeSymbols.PALETTE_DOWN_FILL,
        handle: { ...handle, stroke: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR },
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
            fill: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
            fillOpacity: 0.2,
            handle: { ...handle },
            statistics: {
                ...measurerStatistics,
                color: '#fff',
                fill: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
                strokeWidth: 0,
                divider: {
                    stroke: '#fff',
                    strokeWidth: 1,
                    strokeOpacity: 0.5,
                },
            },
        },
        down: {
            ...stroke,
            stroke: ThemeSymbols.DEFAULT_ANNOTATION_STATISTICS_DOWN_STROKE,
            fill: ThemeSymbols.DEFAULT_ANNOTATION_STATISTICS_DOWN_FILL,
            fillOpacity: 0.2,
            handle: {
                ...handle,
                stroke: ThemeSymbols.DEFAULT_ANNOTATION_STATISTICS_DOWN_STROKE,
            },
            statistics: {
                ...measurerStatistics,
                color: '#fff',
                fill: ThemeSymbols.DEFAULT_ANNOTATION_STATISTICS_DOWN_FILL,
                strokeWidth: 0,
                divider: {
                    stroke: '#fff',
                    strokeWidth: 1,
                    strokeOpacity: 0.5,
                },
            },
        },
    },
};
