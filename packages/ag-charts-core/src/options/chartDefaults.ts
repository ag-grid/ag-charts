import {
    type AgBaseSeriesOptions,
    type AgBaseSeriesThemeableOptions,
    type AgBaseThemeableChartOptions,
    type AgChartAutoSizedBaseLabelOptions,
    type AgChartCaptionOptions,
    type AgChartLabelAutoFontSizeOptions,
    type AgChartLabelCollisionFitOptions,
    type AgChartLabelCollisionOptions,
    type AgChartLabelFitOptions,
    type AgChartLabelOptions,
    type AgChartLabelPlacementStyleOptions,
    type AgChartLabelStyleOptions,
    type AgChartLegendOptions,
    type AgChartLegendPlacement,
    type AgChartLegendPositionOptions,
    type AgChartOverlayOptions,
    type AgContextMenuItem,
    type AgContextMenuItemLiteral,
    type AgContextMenuItemShowOn,
    type AgContextMenuItemType,
    type AgDropShadowOptions,
    type AgErrorBarOptions,
    type AgErrorBarThemeableOptions,
    type AgGradientLegendOptions,
    type AgInitialFocus,
    type AgInterpolationType,
    type AgLineSeriesLabelOptions,
    type AgSeriesMarkerOptions,
    type AgSeriesMarkerStyle,
    type AgSeriesTooltip,
    type AgTimeInterval,
    type AgTooltipRendererDataRow,
    type AgTooltipRendererResult,
    type FormatterPropertyType,
    type ImageSegment,
    type TextSegment,
    type ToolbarButton,
} from 'ag-charts-types';

import { isValidNumberFormat } from '../format/numberFormat';
import {
    borderOptionsDef,
    colorOrRef,
    colorUnion,
    fillOptionsDef,
    fontOptionsDef,
    highlightOptionsDef,
    labelBoxOptionsDef,
    lineDashOptionsDef,
    multiSeriesHighlightOptionsDef,
    overflowStrategy,
    padding,
    selectionOptionsDef,
    shapeHighlightOptionsDef,
    shapeSelectionOptionsDef,
    strokeOptionsDef,
    textAlign,
    textWrap,
    themeOperator,
} from './optionsDefaults';
import {
    ErrorType,
    type OptionsDefs,
    ValidationError,
    type Validator,
    type ValidatorContext,
    type ValidatorResult,
    and,
    array,
    arrayOf,
    arrayOfDefs,
    attachDescription,
    boolean,
    callback,
    callbackDefs,
    callbackOf,
    color,
    constant,
    date,
    defined,
    greaterThan,
    htmlElement,
    lessThan,
    lessThanOrEqual,
    number,
    numericValue,
    optionsDefs,
    or,
    positiveNumber,
    positiveNumberNonZero,
    ratio,
    required,
    strictUnion,
    string,
    typeUnion,
    undocumented,
    undocumentedDefs,
    union,
    unionOrArray,
    validate,
} from './validation';

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
            const { cleared, invalid } = validate(value, legendPositionOptionsDef, context.path, context.params);
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

const tooltipPlacementDef = unionOrArray(
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
export const seriesTooltipRangeValidator = or(positiveNumber, union('exact', 'nearest'));
const verticalAlignValidator = union('baseline', 'top', 'middle', 'bottom');

const textSegmentValidator = optionsDefs<TextSegment>({
    type: constant('text'),
    text: required(string),
    verticalAlign: verticalAlignValidator,
    lineHeight: positiveNumber,
    minimumFontSize: and(positiveNumberNonZero, lessThanOrEqual('fontSize')),
    ...fontOptionsDef,
});

const imageSegmentValidator = optionsDefs<ImageSegment>({
    type: required(constant('image')),
    url: required(string),
    width: required(positiveNumber),
    height: required(positiveNumber),
    alt: string,
    verticalAlign: verticalAlignValidator,
    overflowStrategy: union('keep', 'hide'),
    padding,
    cornerRadius: positiveNumber,
    backgroundFill: color,
    block: boolean,
});

const segmentValidator = or(textSegmentValidator, imageSegmentValidator);

export const textOrSegments = or(
    string,
    // A label/formatter may return an out-of-safe-range bigint, which stringifies for display like any number.
    numericValue,
    date,
    arrayOf(segmentValidator, 'text or image segments array', false)
);

const chartCaptionOptionsDefs: OptionsDefs<AgChartCaptionOptions> = {
    enabled: boolean,
    text: textOrSegments,
    textAlign,
    wrapping: textWrap,
    spacing: positiveNumber,
    maxWidth: positiveNumber,
    maxHeight: positiveNumber,
    minimumFontSize: and(positiveNumberNonZero, lessThanOrEqual('fontSize')),
    ...fontOptionsDef,
    ...labelBoxOptionsDef,
    tooltip: {
        visible: union('auto', 'always', 'never'),
        text: string,
        renderer: callbackOf(or(string, number, date)),
    },
    listeners: {
        click: callback,
        doubleClick: callback,
    },
    ...undocumentedDefs({
        truncate: boolean,
        layoutStyle: union('block', 'overlay'),
    }),
};

const chartOverlayOptionsDefs: OptionsDefs<AgChartOverlayOptions> = {
    enabled: boolean,
    text: textOrSegments,
    renderer: callbackOf(or(string, number, date, htmlElement)),
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
    type: strictUnion<AgContextMenuItemType>()('action', 'separator'),
    showOn: strictUnion<AgContextMenuItemShowOn>()(
        'always',
        'axis',
        'caption',
        'cross-line',
        'series-area',
        'series-node',
        'legend-item'
    ),
    label: required(string),
    enabled: boolean,
    action: callback,
    items: (value: unknown, context: ValidatorContext) => contextMenuItemsArray(value, context),
    ...undocumentedDefs({
        iconUrl: string,
    }),
};

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
    iconPosition: union('before', 'after'),
    icon: union(
        'align-center',
        'align-left',
        'align-right',
        'arrow-drawing',
        'arrow-down-drawing',
        'arrow-up-drawing',
        'callout-annotation',
        'candlestick-series',
        'chevron-filled-down',
        'chevron-right',
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

export const timeIntervalUnit = union('millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year');

const timeIntervalDefs: OptionsDefs<AgTimeInterval> = {
    unit: required(timeIntervalUnit),
    step: positiveNumberNonZero,
    epoch: date,
    utc: boolean,
    // Required for interop.
    ...undocumentedDefs({ every: callback }),
};

export const timeInterval = optionsDefs<AgTimeInterval>(timeIntervalDefs, 'a time interval object');

// The `legend` plugin module re-validates these options on a second pass; both passes must share one definition.
export const legendOptionsDefs: OptionsDefs<AgChartLegendOptions> = {
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
            padding: padding,
            strokeWidth: positiveNumber,
            disabledStyle: {
                opacity: ratio,
                ...fillOptionsDef,
                ...strokeOptionsDef,
            },
        },
        line: {
            length: positiveNumber,
            strokeWidth: positiveNumber,
            disabledStyle: {
                opacity: ratio,
                stroke: colorOrRef,
                strokeOpacity: ratio,
                ...lineDashOptionsDef,
            },
        },
        label: {
            maxLength: positiveNumber,
            formatter: callback,
            ...fontOptionsDef,
            disabledStyle: {
                opacity: ratio,
                color: colorOrRef,
            },
        },
        tooltip: {
            visible: union('auto', 'always', 'never'),
            text: string,
            renderer: callback,
        },
        maxWidth: positiveNumber,
        padding: padding,
        showSeriesStroke: boolean,
    },
    pagination: {
        marker: {
            size: positiveNumber,
            shape: shapeValidator,
            padding: padding,
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
};

// The `gradientLegend` plugin module re-validates these options on a second pass; both passes must share one definition.
export const gradientLegendOptionsDefs: OptionsDefs<AgGradientLegendOptions> = {
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
};

/** Chart-level keys owned by plugin modules; their defs arrive through the modules' contributions. */
export type ModuleOwnedChartOptions =
    | 'animation'
    | 'annotations'
    | 'chartToolbar'
    | 'contextMenu'
    | 'dataSource'
    | 'flashOnUpdate'
    | 'gradientLegend'
    | 'legend'
    | 'locale'
    | 'navigator'
    | 'ranges'
    | 'scrollbar'
    | 'selection'
    | 'sync'
    | 'zoom';

export const commonChartOptionsDefs: OptionsDefs<Omit<AgBaseThemeableChartOptions, ModuleOwnedChartOptions>> = {
    width: positiveNumber,
    height: positiveNumber,
    minWidth: positiveNumber,
    minHeight: positiveNumber,
    suppressFieldDotNotation: boolean,
    title: chartCaptionOptionsDefs,
    subtitle: chartCaptionOptionsDefs,
    footnote: chartCaptionOptionsDefs,
    padding: or(themeOperator, padding),
    seriesArea: {
        border: borderOptionsDef,
        clip: boolean,
        cornerRadius: number,
        padding: or(themeOperator, padding),
    },
    listeners: {
        seriesNodeClick: callback,
        seriesNodeDoubleClick: callback,
        axisClick: callback,
        axisDoubleClick: callback,
        captionClick: callback,
        captionDoubleClick: callback,
        seriesVisibilityChange: callback,
        activeChange: callback,
        selectionChange: callback,
        collapsedChange: callback,
        click: callback,
        doubleClick: callback,
        crossLineClick: callback,
        crossLineDoubleClick: callback,
        annotations: callback,
        zoom: callback,
    },
    loadGoogleFonts: boolean,
    highlight: {
        enabled: boolean,
        drawingMode: union('overlay', 'cutout'),
        range: union('tooltip', 'node'),
        mode: union('single', 'shared'),
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
        wrapping: textWrap,
        mode: union('single', 'shared', 'compact'),
        position: {
            anchorTo: union('pointer', 'node', 'chart'),
            placement: tooltipPlacementDef,
            xOffset: number,
            yOffset: number,
            offset: positiveNumber,
        },
    },
    context: () => true,
    keyboard: {
        enabled: boolean,
        tabIndex: number,
        initialFocus: strictUnion<AgInitialFocus>()('data-start', 'data-end', 'viewport-start', 'viewport-end'),
    },
    touch: {
        dragAction: union('none', 'drag', 'hover'),
    },
    background: {
        visible: boolean,
        fill: colorOrRef,
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
    formatter: or(callbackOf(textOrSegments), formatObjectValidator),
    enableRtl: boolean,
    ...undocumentedDefs({
        statusBar: defined,
        foreground: {
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
        },
        overrideDevicePixelRatio: number,
        displayNullData: boolean,
        mode: union('integrated', 'standalone'),
    }),
};

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
    selection: selectionOptionsDef(shapeSelectionOptionsDef),
    ...undocumentedDefs({
        allowNullKeys: boolean,
    }),
};

export const commonSeriesOptionsDefs: OptionsDefs<AgBaseSeriesOptions<any>> = {
    ...commonSeriesThemeableOptionsDefs,
    id: string,
    visible: boolean,
    context: () => true,
    data: array,
    ...undocumentedDefs({
        seriesGrouping: defined,
    }),
};

export const shadowOptionsDefs: OptionsDefs<AgDropShadowOptions> = {
    enabled: boolean,
    xOffset: number,
    yOffset: number,
    blur: positiveNumber,
    color: colorOrRef,
};

/** Validation for a series whose highlighted item can also cast a `shadow`; the other highlight slots cannot. */
export function shadowHighlightOptionsDef<I extends object>(itemHighlightOptionsDef: I) {
    return {
        ...highlightOptionsDef(itemHighlightOptionsDef),
        highlightedItem: { ...itemHighlightOptionsDef, shadow: shadowOptionsDefs },
    };
}

/** As {@link shadowHighlightOptionsDef}, for a series that also has highlighted-series and unhighlighted-series slots. */
export function multiSeriesShadowHighlightOptionsDef<I extends object, S>(
    itemHighlightOptionsDef: I,
    seriesHighlightOptionsDef: S
) {
    return {
        ...multiSeriesHighlightOptionsDef(itemHighlightOptionsDef, seriesHighlightOptionsDef),
        highlightedItem: { ...itemHighlightOptionsDef, shadow: shadowOptionsDefs },
    };
}

export const markerStyleOptionsDefs: OptionsDefs<AgSeriesMarkerStyle> = {
    shape: shapeValidator,
    size: positiveNumber,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const markerOptionsDefs: OptionsDefs<AgSeriesMarkerOptions<any, any>> = {
    enabled: boolean,
    shadow: shadowOptionsDefs,
    itemStyler: callbackDefs<AgSeriesMarkerStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        shape: shapeValidator,
        size: positiveNumber,
    }),
    ...markerStyleOptionsDefs,
};

/** Directional label placement accepting a single value or an ordered fallback list. */
export const labelCollisionPlacementDef = unionOrArray(
    'inside',
    'top',
    'bottom',
    'left',
    'right',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right'
);

/** Label orientation accepting a single value or an ordered fallback list. */
export const labelOrientationDef = unionOrArray('horizontal', 'vertical', 'vertical-reversed');

export const collisionOptionsDef: OptionsDefs<AgChartLabelCollisionOptions> = {
    threshold: number,
    alwaysShow: boolean,
    ...undocumentedDefs({
        collideWith: {
            markers: boolean,
            labels: boolean,
            seriesItems: boolean,
            seriesArea: boolean,
            axisLabels: boolean,
        },
    }),
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

/** Label-fit defs shared by series that fit their labels to a placement region. */
export const labelFitOptionsDefs: OptionsDefs<AgChartLabelFitOptions> = {
    maxWidth: positiveNumber,
    maxHeight: positiveNumber,
    wrapping: textWrap,
    truncate: boolean,
};

/** Label-fit defs kept usable internally while withheld from the documented option surface. */
export const undocumentedLabelFitOptionsDefs: OptionsDefs<AgChartLabelFitOptions> = {
    maxWidth: undocumented(positiveNumber),
    maxHeight: undocumented(positiveNumber),
    wrapping: undocumented(textWrap),
    truncate: undocumented(boolean),
};

/** Font-reduction defs for series whose labels shrink to fit before truncating or hiding. */
export const labelAutoFontSizeOptionsDefs: OptionsDefs<AgChartLabelAutoFontSizeOptions> = {
    minimumFontSize: and(positiveNumberNonZero, lessThanOrEqual('fontSize')),
};

/** Label-fit defs plus the collision object, for series that place their labels against obstacles. */
export const labelCollisionFitOptionsDefs: OptionsDefs<AgChartLabelCollisionFitOptions> = {
    ...labelFitOptionsDefs,
    collision: collisionOptionsDef,
};

/** Style overrides applied to a label for its resolved inside/outside placement. */
export const labelPlacementStyleOptionsDef: OptionsDefs<AgChartLabelPlacementStyleOptions> = {
    color: colorOrRef,
    ...labelBoxOptionsDef,
};

/** `insideStyle`/`outsideStyle` placement-reactive overrides shared by inside/outside-placement labels. */
export const labelPlacementStyleDefs = {
    insideStyle: labelPlacementStyleOptionsDef,
    outsideStyle: labelPlacementStyleOptionsDef,
};

/** Label defs for point-like series (line, area, scatter, bubble) that expose a directional placement. */
export const placedSeriesLabelOptionsDefs: OptionsDefs<AgLineSeriesLabelOptions<any, any>> = {
    ...seriesLabelOptionsDefs,
    ...labelCollisionFitOptionsDefs,
    ...labelAutoFontSizeOptionsDefs,
    ...labelPlacementStyleDefs,
    placement: labelCollisionPlacementDef,
    spacing: positiveNumber,
};

export const autoSizedLabelOptionsDefs: OptionsDefs<AgChartAutoSizedBaseLabelOptions<any, any>> = {
    ...seriesLabelOptionsDefs,
    lineHeight: positiveNumber,
    minimumFontSize: and(positiveNumber, lessThanOrEqual('fontSize')),
    wrapping: textWrap,
    overflowStrategy: overflowStrategy,
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
    range: seriesTooltipRangeValidator,
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
                            stroke: colorOrRef,
                            strokeOpacity: ratio,
                            strokeWidth: positiveNumber,
                            ...lineDashOptionsDef,
                        },
                        line: {
                            enabled: boolean,
                            stroke: colorOrRef,
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
        placement: tooltipPlacementDef,
        xOffset: number,
        yOffset: number,
        offset: positiveNumber,
    },
    interaction: {
        enabled: boolean,
    },
};

export const tooltipOptionsDefsWithArea: OptionsDefs<AgSeriesTooltip<any>> = {
    ...tooltipOptionsDefs,
    range: rangeValidator,
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
