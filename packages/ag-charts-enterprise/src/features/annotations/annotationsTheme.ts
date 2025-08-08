import {
    type AgAnnotationAxisLabel,
    type AgAnnotationOptionsToolbar,
    type AgAnnotationsThemeableOptions,
    type AgAnnotationsToolbar,
    type AgAnnotationsToolbarButton,
    type AgChannelAnnotationTextStyles,
    type AgLineAnnotationTextStyles,
    type AgMeasurerAnnotationStatistics,
    type AgMeasurerAnnotationStyles,
    type FontOptions,
    type StrokeOptions,
    type WithThemeParams,
    _ModuleSupport,
} from 'ag-charts-community';

const { FONT_SIZE_RATIO, ThemeSymbols } = _ModuleSupport;

const stroke: WithThemeParams<StrokeOptions> = {
    stroke: { $ref: 'foregroundColor' },
    strokeOpacity: 1,
    strokeWidth: 2,
};

const handle = {
    fill: ThemeSymbols.DEFAULT_ANNOTATION_HANDLE_FILL,
    strokeOpacity: 1,
    strokeWidth: 2,
};

const font: WithThemeParams<FontOptions> = {
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
    textAlign: 'left',
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

const measurerStatistics: WithThemeParams<AgMeasurerAnnotationStatistics> = {
    ...font,
    fontSize: { $ref: 'fontSize' },
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

const measurer: WithThemeParams<AgMeasurerAnnotationStyles> = {
    ...stroke,
    background: {
        fill: { $ref: 'foregroundColor' },
        fillOpacity: 0.075,
    },
    handle: { ...handle },
    text: { ...lineText },
    statistics: { ...measurerStatistics },
};

type AgAnnotationsToolbarWithUndocumented = Omit<AgAnnotationsToolbar, 'buttons' | 'padding'> & {
    buttons: (AgAnnotationsToolbarButton & { haspopup: 'menu' | 'false' })[];
    padding: AgAnnotationsToolbar['padding'] | { $ref: 'chartPadding' };
};

const toolbar: AgAnnotationsToolbarWithUndocumented = {
    buttons: [
        {
            icon: 'text-annotation',
            tooltip: 'toolbarAnnotationsTextAnnotations',
            value: 'text-menu',
            haspopup: 'menu',
        },
        {
            icon: 'trend-line-drawing',
            tooltip: 'toolbarAnnotationsLineAnnotations',
            value: 'line-menu',
            haspopup: 'menu',
        },
        {
            icon: 'arrow-drawing',
            tooltip: 'toolbarAnnotationsShapeAnnotations',
            value: 'shape-menu',
            haspopup: 'menu',
        },
        {
            icon: 'delete',
            tooltip: 'toolbarAnnotationsClearAll',
            value: 'clear',
            haspopup: 'false',
        },
    ],
    padding: { $ref: 'chartPadding' },
};

type AgAnnotationOptionsToolbarWithUndocumented = Omit<AgAnnotationOptionsToolbar, 'buttons'> & {
    buttons: (NonNullable<AgAnnotationOptionsToolbar['buttons']>[number] & { haspopup: 'menu' | 'dialog' | 'false' })[];
};

const optionsToolbar: AgAnnotationOptionsToolbarWithUndocumented = {
    buttons: [
        {
            icon: 'text-annotation',
            tooltip: 'toolbarAnnotationsTextColor',
            value: 'text-color',
            haspopup: 'dialog',
        },
        {
            icon: 'line-color',
            tooltip: 'toolbarAnnotationsLineColor',
            value: 'line-color',
            haspopup: 'dialog',
        },
        {
            icon: 'fill-color',
            tooltip: 'toolbarAnnotationsFillColor',
            value: 'fill-color',
            haspopup: 'dialog',
        },
        {
            tooltip: 'toolbarAnnotationsTextSize',
            value: 'text-size',
            haspopup: 'menu',
        },
        {
            tooltip: 'toolbarAnnotationsLineStrokeWidth',
            value: 'line-stroke-width',
            haspopup: 'menu',
        },
        {
            icon: 'line-style-solid',
            tooltip: 'toolbarAnnotationsLineStyle',
            value: 'line-style-type',
            haspopup: 'menu',
        },
        {
            icon: 'settings',
            tooltip: 'toolbarAnnotationsSettings',
            value: 'settings',
            haspopup: 'dialog',
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
            haspopup: 'false',
        },
        {
            icon: 'delete',
            tooltip: 'toolbarAnnotationsDelete',
            value: 'delete',
            haspopup: 'false',
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
        text: { ...channelText },
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
        text: { ...channelText },
    },

    // Fibonnaccis
    'fibonacci-retracement': {
        ...stroke,
        strokes: ThemeSymbols.DEFAULT_FIBONACCI_STROKES as unknown as string[],
        rangeStroke: { $ref: 'foregroundColor' },
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
        strokes: ThemeSymbols.DEFAULT_FIBONACCI_STROKES as unknown as string[],
        rangeStroke: { $ref: 'foregroundColor' },
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
        color: ThemeSymbols.DEFAULT_TEXTBOX_COLOR,
        fill: ThemeSymbols.DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
        stroke: { $ref: 'chartBackgroundColor' },
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
