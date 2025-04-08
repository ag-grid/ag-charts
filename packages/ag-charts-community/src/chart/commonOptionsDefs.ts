import {
    ErrorType,
    ValidationError,
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
    fillOptionsDef,
    fontOptionsDef,
    greaterThan,
    htmlElement,
    lessThan,
    lineDashOptionsDef,
    number,
    object,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    strokeOptionsDef,
    typeUnion,
    undocumented,
    union,
} from 'ag-charts-core';
import type { OptionsDefs, Validator, ValidatorContext, ValidatorResult } from 'ag-charts-core';
import type {
    AgBaseSeriesOptions,
    AgBaseThemeableChartOptions,
    AgChartAutoSizedBaseLabelOptions,
    AgChartCaptionOptions,
    AgChartLabelOptions,
    AgChartOverlayOptions, // eslint-disable-next-line sonarjs/deprecation
    AgContextMenuAction,
    AgContextMenuItem,
    AgContextMenuItemLiteral,
    AgDropShadowOptions,
    AgErrorBarOptions,
    AgErrorBarThemeableOptions,
    AgInterpolationType,
    AgRangesButton,
    AgSeriesMarkerOptions,
    AgSeriesMarkerStyle,
    AgSeriesTooltip,
    AgTooltipRendererDataRow,
    AgTooltipRendererResult,
    AgZoomButton,
    ToolbarButton,
} from 'ag-charts-types';

import { numberFormatValidator } from './axesOptionsDefs';

const shapeValidator = or(
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
const tooltipDeprecatedTypeValidator = union(
    'pointer',
    'node',
    'top',
    'right',
    'bottom',
    'left',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right'
);
const rangeValidator = or(positiveNumber, union('exact', 'nearest'));
// const themeValidator = or(
//     union(
//         'ag-default',
//         'ag-default-dark',
//         'ag-sheets',
//         'ag-sheets-dark',
//         'ag-polychroma',
//         'ag-polychroma-dark',
//         'ag-vivid',
//         'ag-vivid-dark',
//         'ag-material',
//         'ag-material-dark',
//         'ag-financial',
//         'ag-financial-dark'
//     ),
//     optionsDefs(themeOptionsDef, 'a theme object')
// );

const zoomAnchorPoint = union('pointer', 'start', 'middle', 'end');

const chartCaptionOptionsDefs: OptionsDefs<AgChartCaptionOptions> = {
    enabled: boolean,
    text: string,
    textAlign: union('left', 'center', 'right'),
    wrapping: union('never', 'always', 'hyphenate', 'on-space'),
    spacing: positiveNumber,
    maxWidth: positiveNumber,
    maxHeight: positiveNumber,
    ...fontOptionsDef,
};

const chartOverlayOptionsDefs: OptionsDefs<AgChartOverlayOptions> = {
    enabled: boolean,
    text: string,
    renderer: callbackOf(or(string, htmlElement)),
};

const contextMenuItemLiterals: AgContextMenuItemLiteral[] = [
    'defaults',
    'download',
    'zoom-to-cursor',
    'pan-to-cursor',
    'toggle-series-visibility',
    'toggle-other-series',
    'reset-zoom',
];

const contextMenuItemObjectValidator: Validator = optionsDefs<Extract<AgContextMenuItem, object>>({
    type: union('action', 'submenu', 'separator'),
    showOn: union('always', 'series-area', 'series-node', 'legend-item'),
    label: required(string),
    enable: boolean,
    iconUrl: string,
    action: callback,
    items: (value, context) => contextMenuItemsArray(value, context),
});

const contextMenuItemValidator = attachDescription(
    (value: unknown, context: ValidatorContext): boolean | ValidatorResult => {
        let result: ValidatorResult | boolean;
        if (typeof value === 'string') {
            const allowedValues: readonly string[] = contextMenuItemLiterals;
            if (allowedValues.includes(value)) {
                result = true;
            } else {
                result = { valid: false, invalid: [], cleared: {} } satisfies ValidatorResult;
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

const contextMenuItemsArray = arrayOf(contextMenuItemValidator, 'a menu items array', 'or');

// eslint-disable-next-line sonarjs/deprecation
const contextMenuActionsArray = arrayOfDefs<AgContextMenuAction>(
    {
        label: required(string),
        action: required(callback),
    },
    'a context menu actions array'
);

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

export const commonChartOptionsDefs: OptionsDefs<Omit<AgBaseThemeableChartOptions, 'navigator'>> = {
    // container: required(instanceOf(HTMLElement)),
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
        clip: boolean,
        padding: {
            top: positiveNumber,
            right: positiveNumber,
            bottom: positiveNumber,
            left: positiveNumber,
        },
    },
    legend: {
        enabled: boolean,
        position: union('top', 'right', 'bottom', 'left'),
        orientation: union('horizontal', 'vertical'),
        maxWidth: positiveNumber,
        maxHeight: positiveNumber,
        spacing: positiveNumber,
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
        position: union('top', 'right', 'bottom', 'left'),
        spacing: positiveNumber,
        reverseOrder: boolean,
        gradient: {
            preferredLength: positiveNumber,
            thickness: positiveNumber,
        },
        scale: {
            label: {
                ...fontOptionsDef,
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
        click: callback,
        doubleClick: callback,
        annotations: callback,
        zoom: callback,
    },
    highlight: {
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
            type: tooltipDeprecatedTypeValidator,
            anchorTo: union('pointer', 'node', 'chart'),
            placement: or(tooltipPlacementValidator, arrayOf(tooltipPlacementValidator)),
            xOffset: number,
            yOffset: number,
        },
    },
    animation: {
        enabled: boolean,
        duration: positiveNumber,
    },
    contextMenu: {
        enabled: boolean,
        items: contextMenuItemsArray,
        extraActions: contextMenuActionsArray,
        extraSeriesAreaActions: contextMenuActionsArray,
        extraNodeActions: contextMenuActionsArray,
        extraLegendItemActions: contextMenuActionsArray,
    },
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
            url: string,
            top: number,
            right: number,
            bottom: number,
            left: number,
            width: positiveNumber,
            height: positiveNumber,
            opacity: ratio,
        },
    },
    sync: {
        enabled: boolean,
        groupId: string,
        axes: union('x', 'y', 'xy'),
        nodeInteraction: boolean,
        zoom: boolean,
    },
    zoom: {
        enabled: boolean,
        enableAxisDragging: boolean,
        enableDoubleClickToReset: boolean,
        enablePanning: boolean,
        enableScrolling: boolean,
        enableSelecting: boolean,
        enableTwoFingerZoom: boolean,
        keepAspectRatio: boolean,
        anchorPointX: zoomAnchorPoint,
        anchorPointY: zoomAnchorPoint,
        axes: union('x', 'y', 'xy'),
        deceleration: or(union('off', 'short', 'long'), ratio),
        minVisibleItems: positiveNumber,
        minVisibleItemsX: positiveNumber,
        minVisibleItemsY: positiveNumber,
        panKey: union('alt', 'ctrl', 'meta', 'shift'),
        scrollingStep: ratio,
        autoScaling: {
            enabled: boolean,
            padding: ratio,
        },
        buttons: {
            enabled: boolean,
            buttons: arrayOfDefs<AgZoomButton>(
                {
                    ...toolbarButtonOptionsDefs,
                    value: union('reset', 'zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-start', 'pan-end'),
                    section: string,
                },
                'zoom button options array'
            ),
            visible: union('always', 'zoomed', 'hover'),
        },
    },
};

// @ts-expect-error undocumented option
commonChartOptionsDefs.dataSource.requestThrottle = undocumented(positiveNumber);
// @ts-expect-error undocumented option
commonChartOptionsDefs.dataSource.updateThrottle = undocumented(positiveNumber);
// @ts-expect-error undocumented option
commonChartOptionsDefs.dataSource.updateDuringInteraction = undocumented(boolean);

// @ts-expect-error undocumented option
commonChartOptionsDefs.zoom.enableIndependentAxes = undocumented(boolean);
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
commonChartOptionsDefs.context = undocumented(() => true);
// @ts-expect-error undocumented option
commonChartOptionsDefs.overrideDevicePixelRatio = undocumented(number);

export const commonSeriesOptionsDefs: OptionsDefs<AgBaseSeriesOptions<any>> = {
    id: string,
    cursor: string,
    visible: boolean,
    data: arrayOf(object),
    showInLegend: boolean,
    nodeClickRange: rangeValidator,
    listeners: {
        nodeClick: callback,
        nodeDoubleClick: callback,
    },
    highlightStyle: {
        item: { ...fillOptionsDef, ...strokeOptionsDef },
        series: {
            enabled: boolean,
            dimOpacity: ratio,
            strokeWidth: positiveNumber,
        },
    },
};

// @ts-expect-error undocumented option
commonSeriesOptionsDefs.context = undocumented(() => true);
// @ts-expect-error undocumented option
commonSeriesOptionsDefs.seriesGrouping = undocumented(defined);

// @ts-expect-error undocumented option
commonSeriesOptionsDefs.highlight = undocumented({ enabled: boolean });

export const markerOptionsDefs: OptionsDefs<AgSeriesMarkerOptions<any, any>> = {
    enabled: boolean,
    shape: shapeValidator,
    size: positiveNumber,
    itemStyler: callbackDefs<AgSeriesMarkerStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        shape: shapeValidator,
        size: positiveNumber,
    }),
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const seriesLabelOptionsDefs: OptionsDefs<AgChartLabelOptions<any, any>> = {
    enabled: boolean,
    formatter: callback,
    ...fontOptionsDef,
};

export const autoSizedLabelOptionsDefs: OptionsDefs<AgChartAutoSizedBaseLabelOptions<any, any>> = {
    ...seriesLabelOptionsDefs,
    lineHeight: positiveNumber,
    minimumFontSize: positiveNumber,
    wrapping: textWrapValidator,
    overflowStrategy: union('ellipsis', 'hide'),
};

export const errorBarOptionsDefs: OptionsDefs<AgErrorBarOptions<any>> = {
    visible: boolean,
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

export const tooltipOptionsDefs: OptionsDefs<AgSeriesTooltip<any>> = {
    enabled: boolean,
    showArrow: boolean,
    range: rangeValidator,
    renderer: callbackOf(
        or(
            string,
            optionsDefs<AgTooltipRendererResult>(
                {
                    heading: string,
                    title: string,
                    data: arrayOfDefs<AgTooltipRendererDataRow>({
                        label: required(string),
                        value: required(string),
                    }),
                },
                'tooltip renderer result object'
            )
        )
    ),
    position: {
        type: tooltipDeprecatedTypeValidator,
        anchorTo: union('node', 'pointer', 'chart'),
        placement: or(tooltipPlacementValidator, arrayOf(tooltipPlacementValidator)),
        xOffset: number,
        yOffset: number,
    },
    interaction: {
        enabled: boolean,
    },
};

// @ts-expect-error undocumented option
tooltipOptionsDefs.position._seriesOverrideType = undocumented(tooltipDeprecatedTypeValidator);

export const shadowOptionsDefs: OptionsDefs<AgDropShadowOptions> = {
    enabled: boolean,
    xOffset: number,
    yOffset: number,
    blur: positiveNumber,
    color: color,
};

export const interpolationValidator = typeUnion<AgInterpolationType>(
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
