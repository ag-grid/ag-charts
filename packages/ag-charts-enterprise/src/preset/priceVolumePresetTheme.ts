import { _ModuleSupport } from 'ag-charts-community';
import type {
    AgAnnotationsThemeableOptions,
    AgMeasurerAnnotationStatistics,
    AgMeasurerAnnotationStyles,
    FontOptions,
    WithThemeParams,
} from 'ag-charts-types';

const {
    FONT_SIZE_RATIO,
    ThemeSymbols: {
        DEFAULT_ANNOTATION_HANDLE_FILL,
        DEFAULT_ANNOTATION_STATISTICS_COLOR,
        DEFAULT_ANNOTATION_STATISTICS_DIVIDER_STROKE,
        DEFAULT_ANNOTATION_STATISTICS_DOWN_FILL,
        DEFAULT_ANNOTATION_STATISTICS_DOWN_STROKE,
        DEFAULT_ANNOTATION_STATISTICS_FILL,
        DEFAULT_ANNOTATION_STATISTICS_STROKE,
        DEFAULT_FIBONACCI_STROKES,
        DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
        DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
        DEFAULT_TEXTBOX_COLOR,
        DEFAULT_TEXTBOX_FILL,
        DEFAULT_TEXTBOX_STROKE,
        DEFAULT_TEXT_ANNOTATION_COLOR,
    },
} = _ModuleSupport;

const stroke = {
    stroke: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
};

const handle = {
    fill: DEFAULT_ANNOTATION_HANDLE_FILL,
};

const axisLabel = {
    color: 'white',
    fill: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
};

const lineText = {
    color: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
};

const font: WithThemeParams<FontOptions> = {
    color: DEFAULT_TEXT_ANNOTATION_COLOR,
    fontSize: { $rem: FONT_SIZE_RATIO.LARGE },
    fontFamily: { $ref: 'fontFamily' },
};

const measurerStatistics: WithThemeParams<AgMeasurerAnnotationStatistics> = {
    ...font,
    fontSize: { $ref: 'fontSize' },
    color: DEFAULT_ANNOTATION_STATISTICS_COLOR,
    fill: DEFAULT_ANNOTATION_STATISTICS_FILL,
    stroke: DEFAULT_ANNOTATION_STATISTICS_STROKE,
    strokeWidth: 1,
    divider: {
        stroke: DEFAULT_ANNOTATION_STATISTICS_DIVIDER_STROKE,
        strokeWidth: 1,
        strokeOpacity: 0.5,
    },
};

const measurer: WithThemeParams<AgMeasurerAnnotationStyles> = {
    ...stroke,
    background: {
        fill: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
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
            fill: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
            fillOpacity: 0.2,
        },
        handle: { ...handle },
        text: { ...lineText },
    },
    'parallel-channel': {
        ...stroke,
        background: {
            fill: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
            fillOpacity: 0.2,
        },
        handle: { ...handle },
        text: { ...lineText },
    },

    // Fibonnaccis
    'fibonacci-retracement': {
        ...stroke,
        strokes: DEFAULT_FIBONACCI_STROKES as unknown as string[],
        rangeStroke: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
        handle: { ...handle },
        text: { ...lineText, position: 'center' },
        label: {
            ...font,
            color: undefined,
            fontSize: { $rem: FONT_SIZE_RATIO.SMALLER },
        },
    },

    'fibonacci-retracement-trend-based': {
        ...stroke,
        strokes: DEFAULT_FIBONACCI_STROKES as unknown as string[],
        rangeStroke: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
        handle: { ...handle },
        text: { ...lineText, position: 'center' },
        label: {
            ...font,
            color: undefined,
            fontSize: { $rem: FONT_SIZE_RATIO.SMALLER },
        },
    },

    // Texts
    callout: {
        ...stroke,
        ...font,
        color: { $ref: 'textColor' },
        handle: { ...handle },
        fill: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
        fillOpacity: 0.2,
    },
    comment: {
        ...font,
        color: 'white',
        fontWeight: 700,
        handle: { ...handle },
        fill: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    },
    note: {
        ...font,
        color: DEFAULT_TEXTBOX_COLOR,
        fill: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
        stroke: { $ref: 'chartBackgroundColor' },
        strokeWidth: 1,
        strokeOpacity: 1,
        handle: { ...handle },
        background: {
            fill: DEFAULT_TEXTBOX_FILL,
            stroke: DEFAULT_TEXTBOX_STROKE,
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
        handle: { ...handle, stroke: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR },
    },
    'arrow-down': {
        fill: { $palette: 'down.fill' },
        handle: { ...handle, stroke: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR },
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
            fill: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
            fillOpacity: 0.2,
            handle: { ...handle },
            statistics: {
                ...measurerStatistics,
                color: '#fff',
                fill: DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
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
            stroke: DEFAULT_ANNOTATION_STATISTICS_DOWN_STROKE,
            fill: DEFAULT_ANNOTATION_STATISTICS_DOWN_FILL,
            fillOpacity: 0.2,
            handle: {
                ...handle,
                stroke: DEFAULT_ANNOTATION_STATISTICS_DOWN_STROKE,
            },
            statistics: {
                ...measurerStatistics,
                color: '#fff',
                fill: DEFAULT_ANNOTATION_STATISTICS_DOWN_FILL,
                strokeWidth: 0,
                divider: {
                    stroke: '#fff',
                    strokeWidth: 1,
                    strokeOpacity: 0.5,
                },
            },
        },
    },
    axesButtons: {
        enabled: true,
    },
};
