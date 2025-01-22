import {
    type AgAnnotationOptionsToolbar,
    type AgAnnotationsThemeableOptions,
    type AgAnnotationsToolbar,
    type WithThemeParams,
    _ModuleSupport,
} from 'ag-charts-community';

const { ThemeSymbols } = _ModuleSupport;

const stroke = {
    stroke: { $ref: 'foregroundColor' as const },
    strokeOpacity: 1,
    strokeWidth: 2,
};

const handle = {
    fill: ThemeSymbols.DEFAULT_ANNOTATION_HANDLE_FILL,
    strokeOpacity: 1,
    strokeWidth: 2,
};

const font = {
    color: { $ref: 'backgroundColor' as const },
    fontSize: 14,
    fontFamily: { $ref: 'fontFamily' as const },
};

const axisLabel = {
    ...font,
    enabled: true,
    fill: { $ref: 'foregroundColor' as const },
    fontSize: { $ref: 'fontSize' as const },
};

const text = {
    ...font,
    textAlign: 'left',
};

const lineText = {
    ...font,
    position: 'top' as const,
    alignment: 'center' as const,
    color: { $ref: 'foregroundColor' as const },
};

const measurerStatistics = {
    ...font,
    fontSize: { $ref: 'fontSize' as const },
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
        fill: { $ref: 'foregroundColor' as const },
        fillOpacity: 0.075,
    },
    handle: { ...handle },
    text: { ...lineText },
    statistics: { ...measurerStatistics },
};

const toolbar: AgAnnotationsToolbar = {
    buttons: [
        {
            icon: 'trend-line-drawing',
            tooltip: 'toolbarAnnotationsLineAnnotations',
            value: 'line-menu',
        },
        {
            icon: 'text-annotation',
            tooltip: 'toolbarAnnotationsTextAnnotations',
            value: 'text-menu',
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
    // @ts-expect-error undocumented option
    padding: { $ref: 'padding' },
};

const optionsToolbar: AgAnnotationOptionsToolbar = {
    buttons: [
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
        background: {
            fill: { $ref: 'foregroundColor' },
            fillOpacity: 0.075,
        },
        handle: { ...handle },
        text: { ...lineText },
    },
    'parallel-channel': {
        ...stroke,
        middle: {
            lineDash: [6, 5],
            strokeWidth: 1,
        },
        background: {
            fill: { $ref: 'foregroundColor' },
            fillOpacity: 0.075,
        },
        handle: { ...handle },
        text: { ...lineText },
    },

    // Fibonnaccis
    'fibonacci-retracement': {
        ...stroke,
        strokes: ThemeSymbols.DEFAULT_FIBONACCI_STROKES as unknown as string[],
        rangeStroke: { $ref: 'foregroundColor' },
        handle: { ...handle },
        text: { ...lineText, position: 'center' },
        label: { ...font, color: undefined, fontSize: 10 },
    },

    'fibonacci-retracement-trend-based': {
        ...stroke,
        strokes: ThemeSymbols.DEFAULT_FIBONACCI_STROKES as unknown as string[],
        rangeStroke: { $ref: 'foregroundColor' },
        handle: { ...handle },
        text: { ...lineText, position: 'center' },
        label: { ...font, color: undefined, fontSize: 10 },
    },

    // Texts
    callout: {
        ...stroke,
        ...text,
        color: { $ref: 'foregroundColor' },
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
        color: ThemeSymbols.DEFAULT_TEXTBOX_COLOR,
        fill: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
        stroke: { $ref: 'backgroundColor' },
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
        color: { $ref: 'foregroundColor' },
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
        handle: { ...handle, stroke: { $ref: 'foregroundColor' } },
    },
    'arrow-down': {
        fill: ThemeSymbols.PALETTE_DOWN_FILL,
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

    axesButtons: {},
    // Toolbars
    toolbar,
    optionsToolbar,
};
