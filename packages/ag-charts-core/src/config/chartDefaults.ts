import {
    type AgBaseSeriesOptions,
    type AgBaseSeriesThemeableOptions,
    type AgBaseThemeableChartOptions,
    type AgChartAutoSizedBaseLabelOptions,
    type AgChartCaptionOptions,
    type AgChartLabelOptions,
    type AgChartLabelStyleOptions,
    type AgChartLegendPlacement,
    type AgChartLegendPositionOptions,
    type AgChartOverlayOptions,
    type AgContextMenuItem,
    type AgContextMenuItemLiteral,
    type AgDropShadowOptions,
    type AgErrorBarOptions,
    type AgErrorBarThemeableOptions,
    type AgInterpolationType,
    type AgRangesButton,
    type AgSeriesMarkerOptions,
    type AgSeriesMarkerStyle,
    type AgSeriesTooltip,
    type AgTooltipRendererDataRow,
    type AgTooltipRendererResult,
    type FormatterPropertyType,
    type TextSegment,
    type ToolbarButton,
} from 'ag-charts-types';

import {
    ErrorType,
    type OptionsDefs,
    ValidationError,
    type Validator,
    type ValidatorContext,
    type ValidatorResult,
    and,
    array,
    arrayLength,
    arrayOf,
    arrayOfDefs,
    attachDescription,
    boolean,
    callback,
    callbackDefs,
    callbackOf,
    color,
    date,
    defined,
    greaterThan,
    htmlElement,
    lessThan,
    number,
    object,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    typeUnion,
    undocumented,
    union,
    validate,
} from '../state/validation';
import { isValidNumberFormat } from '../utils/format/numberFormat';
import {
    borderOptionsDef,
    colorUnion,
    fillOptionsDef,
    fontOptionsDef,
    highlightOptionsDef,
    labelBoxOptionsDef,
    lineDashOptionsDef,
    padding,
    shapeHighlightOptionsDef,
    strokeOptionsDef,
} from './optionsDefaults';

const legendPlacementLiterals: readonly AgChartLegendPlacement[] = [
    'top',
    'top-right',
    'top-left',
    'bottom',
    'bottom-right',
    'bottom-left',
    'right',
    'right-top',
    'right-bottom',
    'left',
    'left-top',
    'left-bottom',
];

const legendPositionOptionsDef: OptionsDefs<AgChartLegendPositionOptions> = {
    floating: boolean,
    placement: union(...legendPlacementLiterals),
    xOffset: number,
    yOffset: number,
};

export const legendPositionValidator: Validator = attachDescription(
    (value: unknown, context: ValidatorContext): boolean | ValidatorResult => {
        let result: ValidatorResult | boolean;
        if (typeof value === 'string') {
            const allowedValues: readonly string[] = legendPlacementLiterals;
            if (allowedValues.includes(value)) {
                result = true;
            } else {
                result = { valid: false, invalid: [], cleared: null } satisfies ValidatorResult;
                result.invalid.push(
                    new ValidationError(
                        ErrorType.Invalid,
                        `a legend placement string: ["${legendPlacementLiterals.join('", "')}"]`,
                        value,
                        context.path
                    )
                );
            }
        } else {
            const { cleared, invalid } = validate(value, legendPositionOptionsDef);
            result = { valid: invalid.length === 0, cleared, invalid };
        }
        return result;
    },
    `a legend position object or placement string`
);
export const shapeValidator = or(
    union('circle', 'cross', 'diamond', 'heart', 'plus', 'pin', 'square', 'star', 'triangle'),
    callback
);
const textWrapValidator = union('never', 'always', 'hyphenate', 'on-space');
const tooltipPlacementValidator = union(
    'top',
    'right',
    'bottom',
    'left',
    'top-right',
    'bottom-right',
    'bottom-left',
    'top-left',
    'center'
);
export const rangeValidator = or(positiveNumber, union('exact', 'nearest', 'area'));
export const textOrSegments = or(
    string,
    number,
    date,
    arrayOfDefs<TextSegment>(
        {
            text: required(string),
            ...fontOptionsDef,
        },
        'text segments array'
    )
);

const chartCaptionOptionsDefs: OptionsDefs<AgChartCaptionOptions> = {
    enabled: boolean,
    text: textOrSegments,
    textAlign: union('left', 'center', 'right'),
    wrapping: union('never', 'always', 'hyphenate', 'on-space'),
    spacing: positiveNumber,
    maxWidth: positiveNumber,
    maxHeight: positiveNumber,
    ...fontOptionsDef,
};
// @ts-expect-error undocumented option
chartCaptionOptionsDefs.padding = undocumented(positiveNumber);

const chartOverlayOptionsDefs: OptionsDefs<AgChartOverlayOptions> = {
    enabled: boolean,
    text: textOrSegments,
    renderer: callbackOf(or(string, htmlElement)),
};

const contextMenuItemLiterals: AgContextMenuItemLiteral[] = [
    'defaults',
    'download',
    'zoom-to-cursor',
    'pan-to-cursor',
    'reset-zoom',
    'toggle-series-visibility',
    'toggle-other-series',
    'separator',
];

const contextMenuItemObjectDef: OptionsDefs<Extract<AgContextMenuItem, object>> = {
    type: union('action', 'separator'),
    showOn: union('always', 'series-area', 'series-node', 'legend-item'),
    label: required(string),
    enabled: boolean,
    action: callback,
    items: (value: unknown, context: ValidatorContext) => contextMenuItemsArray(value, context),
};
// @ts-expect-error undocumented option
contextMenuItemObjectDef.iconUrl = undocumented(string);

const contextMenuItemObjectValidator: Validator = optionsDefs(contextMenuItemObjectDef);

const contextMenuItemValidator = attachDescription(
    (value: unknown, context: ValidatorContext): boolean | ValidatorResult => {
        let result: ValidatorResult | boolean;
        if (typeof value === 'string') {
            const allowedValues: readonly string[] = contextMenuItemLiterals;
            if (allowedValues.includes(value)) {
                result = true;
            } else {
                result = { valid: false, invalid: [], cleared: null } satisfies ValidatorResult;
                result.invalid.push(
                    new ValidationError(
                        ErrorType.Invalid,
                        `a context menu item string alias: ["${contextMenuItemLiterals.join('", "')}"]`,
                        value,
                        context.path
                    )
                );
            }
        } else {
            result = contextMenuItemObjectValidator(value, context);
        }
        return result;
    },
    `a context menu item object or string alias: [${contextMenuItemLiterals.join(', ')}]`
);

export const contextMenuItemsArray = arrayOf(contextMenuItemValidator, 'a menu items array', false);

export const toolbarButtonOptionsDefs: OptionsDefs<ToolbarButton> = {
    label: string,
    ariaLabel: string,
    tooltip: string,
    icon: union(
        'align-center',
        'align-left',
        'align-right',
        'arrow-drawing',
        'arrow-down-drawing',
        'arrow-up-drawing',
        'callout-annotation',
        'candlestick-series',
        'close',
        'comment-annotation',
        'date-range-drawing',
        'date-price-range-drawing',
        'delete',
        'disjoint-channel-drawing',
        'drag-handle',
        'fill-color',
        'line-style-solid',
        'line-style-dashed',
        'line-style-dotted',
        'high-low-series',
        'hlc-series',
        'hollow-candlestick-series',
        'horizontal-line-drawing',
        'line-color',
        'line-series',
        'line-with-markers-series',
        'locked',
        'measurer-drawing',
        'note-annotation',
        'ohlc-series',
        'pan-end',
        'pan-left',
        'pan-right',
        'pan-start',
        'parallel-channel-drawing',
        'position-bottom',
        'position-center',
        'position-top',
        'price-label-annotation',
        'price-range-drawing',
        'reset',
        'settings',
        'step-line-series',
        'text-annotation',
        'trend-line-drawing',
        'fibonacci-retracement-drawing',
        'fibonacci-retracement-trend-based-drawing',
        'unlocked',
        'vertical-line-drawing',
        'zoom-in',
        'zoom-out'
    ),
};

const formatter = or(string, callbackOf(textOrSegments));

export const formatObjectValidator = optionsDefs<Record<FormatterPropertyType, () => string>>({
    x: formatter,
    y: formatter,
    angle: formatter,
    radius: formatter,
    size: formatter,
    color: formatter,
    label: formatter,
    secondaryLabel: formatter,
    sectorLabel: formatter,
    calloutLabel: formatter,
    legendItem: formatter,
});

export const numberFormatValidator = attachDescription(isValidNumberFormat, 'a valid number format string');

export const commonChartOptionsDefs: OptionsDefs<Omit<AgBaseThemeableChartOptions, 'navigator'>> = {
    width: positiveNumber,
    height: positiveNumber,
    minWidth: positiveNumber,
    minHeight: positiveNumber,
    suppressFieldDotNotation: boolean,
    title: chartCaptionOptionsDefs,
    subtitle: chartCaptionOptionsDefs,
    footnote: chartCaptionOptionsDefs,
    padding: {
        top: positiveNumber,
        right: positiveNumber,
        bottom: positiveNumber,
        left: positiveNumber,
    },
    seriesArea: {
        border: borderOptionsDef,
        clip: boolean,
        cornerRadius: number,
        padding: padding,
    },
    legend: {
        enabled: boolean,
        position: legendPositionValidator,
        orientation: union('horizontal', 'vertical'),
        maxWidth: positiveNumber,
        maxHeight: positiveNumber,
        spacing: positiveNumber,
        border: borderOptionsDef,
        cornerRadius: number,
        padding: padding,
        fill: colorUnion,
        fillOpacity: ratio,
        preventHidingAll: boolean,
        reverseOrder: boolean,
        toggleSeries: boolean,
        item: {
            marker: {
                size: positiveNumber,
                shape: shapeValidator,
                padding: positiveNumber,
                strokeWidth: positiveNumber,
            },
            line: {
                length: positiveNumber,
                strokeWidth: positiveNumber,
            },
            label: {
                maxLength: positiveNumber,
                formatter: callback,
                ...fontOptionsDef,
            },
            maxWidth: positiveNumber,
            paddingX: positiveNumber,
            paddingY: positiveNumber,
            showSeriesStroke: boolean,
        },
        pagination: {
            marker: {
                size: positiveNumber,
                shape: shapeValidator,
                padding: positiveNumber,
            },
            activeStyle: {
                ...fillOptionsDef,
                ...strokeOptionsDef,
            },
            inactiveStyle: {
                ...fillOptionsDef,
                ...strokeOptionsDef,
            },
            highlightStyle: {
                ...fillOptionsDef,
                ...strokeOptionsDef,
            },
            label: fontOptionsDef,
        },
        listeners: {
            legendItemClick: callback,
            legendItemDoubleClick: callback,
        },
    },
    gradientLegend: {
        enabled: boolean,
        position: legendPositionValidator,
        spacing: positiveNumber,
        reverseOrder: boolean,
        border: borderOptionsDef,
        cornerRadius: number,
        padding: padding,
        fill: colorUnion,
        fillOpacity: ratio,
        gradient: {
            preferredLength: positiveNumber,
            thickness: positiveNumber,
        },
        scale: {
            label: {
                ...fontOptionsDef,
                minSpacing: positiveNumber,
                format: numberFormatValidator,
                formatter: callback,
            },
            padding: positiveNumber,
            interval: {
                step: number,
                values: array,
                minSpacing: and(positiveNumber, lessThan('maxSpacing')),
                maxSpacing: and(positiveNumber, greaterThan('minSpacing')),
            },
        },
    },
    listeners: {
        seriesNodeClick: callback,
        seriesNodeDoubleClick: callback,
        seriesVisibilityChange: callback,
        activeChange: callback,
        click: callback,
        doubleClick: callback,
        annotations: callback,
        zoom: callback,
    },
    loadGoogleFonts: boolean,
    highlight: {
        drawingMode: union('overlay', 'cutout'),
        range: union('tooltip', 'node'),
    },
    overlays: {
        loading: chartOverlayOptionsDefs,
        noData: chartOverlayOptionsDefs,
        noVisibleSeries: chartOverlayOptionsDefs,
        unsupportedBrowser: chartOverlayOptionsDefs,
    },
    tooltip: {
        enabled: boolean,
        showArrow: boolean,
        pagination: boolean,
        delay: positiveNumber,
        range: rangeValidator,
        wrapping: textWrapValidator,
        mode: union('single', 'shared', 'compact'),
        position: {
            anchorTo: union('pointer', 'node', 'chart'),
            placement: or(tooltipPlacementValidator, arrayOf(tooltipPlacementValidator)),
            xOffset: number,
            yOffset: number,
        },
    },
    animation: defined,
    contextMenu: defined,
    context: () => true,
    dataSource: {
        getData: callback,
    },
    keyboard: {
        enabled: boolean,
        tabIndex: number,
    },
    touch: {
        dragAction: union('none', 'drag', 'hover'),
    },
    ranges: {
        enabled: boolean,
        buttons: arrayOfDefs<AgRangesButton>(
            {
                ...toolbarButtonOptionsDefs,
                value: or(number, and(arrayOf(or(number, date)), arrayLength(2, 2)), callback),
            },
            'range button options array'
        ),
    },
    // modules
    locale: {
        localeText: object,
        getLocaleText: callbackOf(string),
    },
    background: {
        visible: boolean,
        fill: color,
        // enterprise
        image: {
            url: required(string),
            top: number,
            right: number,
            bottom: number,
            left: number,
            width: positiveNumber,
            height: positiveNumber,
            opacity: ratio,
        },
    },
    styleNonce: string,
    sync: defined,
    zoom: defined,
    scrollbar: defined,
    formatter: or(callbackOf(textOrSegments), formatObjectValidator),
};

// @ts-expect-error undocumented option
commonChartOptionsDefs.flashOnUpdate = undocumented(defined);
// @ts-expect-error undocumented option
commonChartOptionsDefs.dataSource.requestThrottle = undocumented(positiveNumber);
// @ts-expect-error undocumented option
commonChartOptionsDefs.dataSource.updateThrottle = undocumented(positiveNumber);
// @ts-expect-error undocumented option
commonChartOptionsDefs.dataSource.updateDuringInteraction = undocumented(boolean);

// @ts-expect-error undocumented option
commonChartOptionsDefs.statusBar = undocumented(defined);

// @ts-expect-error undocumented option
commonChartOptionsDefs.foreground = undocumented({
    visible: boolean,
    text: string,
    image: {
        url: string,
        top: number,
        right: number,
        bottom: number,
        left: number,
        width: positiveNumber,
        height: positiveNumber,
        opacity: ratio,
    },
    ...fillOptionsDef,
});

// @ts-expect-error undocumented option
commonChartOptionsDefs.overrideDevicePixelRatio = undocumented(number);
// @ts-expect-error undocumented option
commonChartOptionsDefs.sync.domainMode = undocumented(union('direction', 'position', 'key'));
// @ts-expect-error undocumented option
commonChartOptionsDefs.displayNullData = undocumented(boolean);

export const commonSeriesThemeableOptionsDefs: OptionsDefs<AgBaseSeriesThemeableOptions<any>> = {
    cursor: string,
    context: () => true,
    showInLegend: boolean,
    nodeClickRange: rangeValidator,
    listeners: {
        seriesNodeClick: callback,
        seriesNodeDoubleClick: callback,
    },
    highlight: highlightOptionsDef(shapeHighlightOptionsDef),
};

// @ts-expect-error undocumented option
commonSeriesThemeableOptionsDefs.allowNullKeys = undocumented(boolean);

export const commonSeriesOptionsDefs: OptionsDefs<AgBaseSeriesOptions<any>> = {
    ...commonSeriesThemeableOptionsDefs,
    id: string,
    visible: boolean,
    context: () => true,
    data: array,
};

// @ts-expect-error undocumented option
commonSeriesOptionsDefs.seriesGrouping = undocumented(defined);

export const markerStyleOptionsDefs: OptionsDefs<AgSeriesMarkerStyle> = {
    shape: shapeValidator,
    size: positiveNumber,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const markerOptionsDefs: OptionsDefs<AgSeriesMarkerOptions<any, any>> = {
    enabled: boolean,
    itemStyler: callbackDefs<AgSeriesMarkerStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        shape: shapeValidator,
        size: positiveNumber,
    }),
    ...markerStyleOptionsDefs,
};

export const seriesLabelOptionsDefs: OptionsDefs<AgChartLabelOptions<any, any>> = {
    enabled: boolean,
    formatter: callbackOf(textOrSegments),
    format: numberFormatValidator,
    itemStyler: callbackDefs<AgChartLabelStyleOptions>({
        enabled: boolean,
        ...labelBoxOptionsDef,
        ...fontOptionsDef,
    }),
    ...labelBoxOptionsDef,
    ...fontOptionsDef,
};

export const autoSizedLabelOptionsDefs: OptionsDefs<AgChartAutoSizedBaseLabelOptions<any, any>> = {
    ...seriesLabelOptionsDefs,
    lineHeight: positiveNumber,
    minimumFontSize: positiveNumber,
    wrapping: textWrapValidator,
    overflowStrategy: union('ellipsis', 'hide'),
};

export const errorBarThemeableOptionsDefs: OptionsDefs<AgErrorBarThemeableOptions> = {
    visible: boolean,
    cap: {
        visible: boolean,
        length: positiveNumber,
        lengthRatio: ratio,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const errorBarOptionsDefs: OptionsDefs<AgErrorBarOptions<any>> = {
    ...errorBarThemeableOptionsDefs,
    xLowerKey: string,
    xUpperKey: string,
    yLowerKey: string,
    yUpperKey: string,
    xLowerName: string,
    xUpperName: string,
    yLowerName: string,
    yUpperName: string,
    itemStyler: callbackDefs<AgErrorBarThemeableOptions>({
        visible: boolean,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cap: {
            visible: boolean,
            length: positiveNumber,
            lengthRatio: ratio,
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
        },
    }),
};

export const tooltipOptionsDefs: OptionsDefs<AgSeriesTooltip<any>> = {
    enabled: boolean,
    showArrow: boolean,
    range: rangeValidator,
    renderer: callbackOf(
        or(
            string,
            number,
            date,
            optionsDefs<AgTooltipRendererResult>(
                {
                    heading: string,
                    title: string,
                    symbol: {
                        marker: {
                            enabled: boolean,
                            shape: shapeValidator,
                            ...fillOptionsDef,
                            stroke: color,
                            strokeOpacity: ratio,
                            strokeWidth: positiveNumber,
                            ...lineDashOptionsDef,
                        },
                        line: {
                            enabled: boolean,
                            stroke: color,
                            strokeWidth: positiveNumber,
                            strokeOpacity: ratio,
                            ...lineDashOptionsDef,
                        },
                    },
                    data: arrayOfDefs<AgTooltipRendererDataRow>({
                        label: required(string),
                        value: required(or(string, number, date)),
                    }),
                },
                'tooltip renderer result object'
            )
        )
    ),
    position: {
        anchorTo: union('node', 'pointer', 'chart'),
        placement: or(tooltipPlacementValidator, arrayOf(tooltipPlacementValidator)),
        xOffset: number,
        yOffset: number,
    },
    interaction: {
        enabled: boolean,
    },
};

export const shadowOptionsDefs: OptionsDefs<AgDropShadowOptions> = {
    enabled: boolean,
    xOffset: number,
    yOffset: number,
    blur: positiveNumber,
    color: color,
};

export const interpolationOptionsDefs = typeUnion<AgInterpolationType>(
    {
        linear: {},
        smooth: {
            tension: ratio,
        },
        step: {
            position: union('start', 'middle', 'end'),
        },
    },
    'interpolation line options'
);
