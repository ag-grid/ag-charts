import {
    type OptionsDefs,
    and,
    arrayLength,
    arrayOf,
    autoSizedLabelOptionsDefs,
    barHighlightOptionsDef,
    boolean,
    callbackDefs,
    colorOrRef,
    colorScaleOptionsDef,
    colorUnion,
    commonSeriesThemeableOptionsDefs,
    defined,
    deprecated,
    fillOptionsDef,
    highlightOptionsDef,
    interpolationOptionsDefs,
    labelAutoFontSizeOptionsDefs,
    labelCollisionFitOptionsDefs,
    labelCollisionPlacementDef,
    labelOrientationDef,
    labelPlacementStyleDefs,
    lessThanOrEqual,
    lineDashOptionsDef,
    lineHighlightOptionsDef,
    markerOptionsDefs,
    markerStyleOptionsDefs,
    multiSeriesHighlightOptionsDef,
    number,
    numberFormatValidator,
    positiveNumber,
    positiveNumberNonZero,
    positiveNumericValue,
    ratio,
    selectionOptionsDef,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    shapeSegmentation,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumentedLabelFitOptionsDefs,
    union,
    unionOrArray,
    without,
} from 'ag-charts-core';
import {
    type AgBoxPlotHighlightStyleOptions,
    type AgBoxPlotSeriesStyle,
    type AgBoxPlotSeriesThemeableOptions,
    type AgCandlestickHighlightStyleOptions,
    type AgCandlestickSeriesItemOptions,
    type AgCandlestickSeriesThemeableOptions,
    type AgChordSeriesLinkStyle,
    type AgChordSeriesNodeStyle,
    type AgChordSeriesThemeableOptions,
    type AgConeFunnelSeriesThemeableOptions,
    type AgFunnelSeriesStyle,
    type AgFunnelSeriesThemeableOptions,
    type AgHeatmapSeriesStyle,
    type AgHeatmapSeriesThemeableOptions,
    type AgMapLineBackgroundThemeableOptions,
    type AgMapLineSeriesStyle,
    type AgMapLineSeriesThemeableOptions,
    type AgMapMarkerSeriesThemeableOptions,
    type AgMapShapeBackgroundThemeableOptions,
    type AgMapShapeSeriesStyle,
    type AgMapShapeSeriesThemeableOptions,
    type AgNetworkSeriesTreeLayout,
    type AgNightingaleSeriesThemeableOptions,
    type AgOhlcSeriesItemOptions,
    type AgOhlcSeriesThemeableOptions,
    type AgOrganizationSeriesThemeableOptions,
    type AgPyramidSeriesStyle,
    type AgPyramidSeriesThemeableOptions,
    type AgRadarAreaSeriesStyle,
    type AgRadarAreaSeriesThemeableOptions,
    type AgRadarSeriesStyle,
    type AgRadarSeriesThemeableOptions,
    type AgRadialBarSeriesThemeableOptions,
    type AgRadialColumnSeriesThemeableOptions,
    type AgRadialSeriesStyle,
    type AgRangeAreaSeriesItemLineThemeableOptions,
    type AgRangeAreaSeriesLineStyle,
    type AgRangeAreaSeriesLineThemeableOptions,
    type AgRangeAreaSeriesStyle,
    type AgRangeAreaSeriesThemeableOptions,
    type AgRangeBarSeriesStyle,
    type AgRangeBarSeriesThemeableOptions,
    type AgSankeySeriesLinkStyle,
    type AgSankeySeriesNodeStyle,
    type AgSankeySeriesThemeableOptions,
    type AgSunburstSeriesStyle,
    type AgSunburstSeriesThemeableOptions,
    type AgTreemapSeriesStyle,
    type AgTreemapSeriesThemeableOptions,
    type AgWaterfallSeriesItemOptions,
    type AgWaterfallSeriesStyle,
    type AgWaterfallSeriesThemeableOptions,
} from 'ag-charts-types';

import { commonAxisLabelOptionsDefs } from '../axesOptionsDefs';

const hierarchyHighlightStyleOptionsDef = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    opacity: ratio,
};

const hierarchySelectionStyleOptionsDef = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    opacity: ratio,
};

export const boxPlotStyleOptionsDef: OptionsDefs<AgBoxPlotSeriesStyle> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
    whisker: {
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    cap: {
        lengthRatio: ratio,
    },
};

export const boxPlotHighlightStyleOptionsDef: OptionsDefs<AgBoxPlotHighlightStyleOptions> = {
    ...boxPlotStyleOptionsDef,
    opacity: ratio,
};

const boxPlotStyler = callbackDefs<AgBoxPlotSeriesStyle>({
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
    whisker: {
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    cap: {
        lengthRatio: ratio,
    },
});

export const boxPlotSeriesThemeableOptionsDef: OptionsDefs<AgBoxPlotSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    showInMiniChart: boolean,
    styler: boxPlotStyler,
    itemStyler: boxPlotStyler,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...boxPlotStyleOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(boxPlotHighlightStyleOptionsDef, boxPlotHighlightStyleOptionsDef),
    segmentation: shapeSegmentation,
    width: positiveNumberNonZero,
    widthRatio: ratio,
};

const candlestickSeriesItemOptionsDef: OptionsDefs<AgCandlestickSeriesItemOptions> = {
    cornerRadius: positiveNumber,
    wick: {
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const candlestickHighlightStyleOptionsDef: OptionsDefs<AgCandlestickHighlightStyleOptions> = {
    ...candlestickSeriesItemOptionsDef,
    opacity: ratio,
};

export const candlestickSeriesThemeableOptionsDef: OptionsDefs<AgCandlestickSeriesThemeableOptions> = {
    item: {
        up: candlestickSeriesItemOptionsDef,
        down: candlestickSeriesItemOptionsDef,
    },
    itemStyler: callbackDefs<AgCandlestickSeriesItemOptions>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
        wick: {
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
        },
    }),
    showInMiniChart: boolean,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    highlight: multiSeriesHighlightOptionsDef(candlestickHighlightStyleOptionsDef, candlestickHighlightStyleOptionsDef),
};

export const chordSeriesThemeableOptionsDef: OptionsDefs<AgChordSeriesThemeableOptions> = {
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    label: {
        spacing: positiveNumber,
        maxWidth: positiveNumber,
        ...seriesLabelOptionsDefs,
    },
    link: {
        tension: ratio,
        itemStyler: callbackDefs<AgChordSeriesLinkStyle>({
            ...fillOptionsDef,
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
            tension: ratio,
        }),
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    node: {
        width: positiveNumber,
        spacing: positiveNumber,
        cornerRadius: positiveNumber,
        itemStyler: callbackDefs<AgChordSeriesNodeStyle>({
            ...fillOptionsDef,
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
            cornerRadius: positiveNumber,
        }),
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
};

Object.assign(chordSeriesThemeableOptionsDef.label, without(undocumentedLabelFitOptionsDefs, ['maxWidth']));

export const coneFunnelSeriesThemeableOptionsDef: OptionsDefs<AgConeFunnelSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    label: {
        spacing: positiveNumber,
        placement: union('before', 'middle', 'after'),
        ...seriesLabelOptionsDefs,
    },
    stageLabel: {
        placement: union('before', 'after'),
        format: numberFormatValidator,
        ...commonAxisLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...without(commonSeriesThemeableOptionsDefs, ['showInLegend']),
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    ...lineDashOptionsDef,
    highlight: highlightOptionsDef(lineHighlightOptionsDef),
};

export const funnelSeriesThemeableOptionsDef: OptionsDefs<AgFunnelSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    itemStyler: callbackDefs<AgFunnelSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    spacingRatio: ratio,
    cornerRadius: positiveNumber,
    crisp: boolean,
    dropOff: {
        enabled: boolean,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    stageLabel: {
        placement: union('before', 'after'),
        format: numberFormatValidator,
        ...commonAxisLabelOptionsDefs,
    },
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...without(commonSeriesThemeableOptionsDefs, ['showInLegend']),
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    ...lineDashOptionsDef,
};

export const heatmapSeriesThemeableOptionsDef: OptionsDefs<AgHeatmapSeriesThemeableOptions> = {
    title: string,
    textAlign: union('left', 'center', 'right'),
    verticalAlign: union('top', 'middle', 'bottom'),
    itemPadding: positiveNumber,
    cornerRadius: positiveNumber,
    itemStyler: callbackDefs<AgHeatmapSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
    }),
    showInMiniChart: boolean,
    label: autoSizedLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    colorScale: colorScaleOptionsDef,
    ...commonSeriesThemeableOptionsDefs,
    ...strokeOptionsDef,
};

export const ohlcSeriesThemeableOptionsDef: OptionsDefs<AgOhlcSeriesThemeableOptions> = {
    showInMiniChart: boolean,
    itemStyler: callbackDefs<AgOhlcSeriesItemOptions>({
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    item: {
        up: {
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
        },
        down: {
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
        },
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    highlight: multiSeriesHighlightOptionsDef(lineHighlightOptionsDef, lineHighlightOptionsDef),
};

export const mapLineSeriesThemeableOptionsDef: OptionsDefs<AgMapLineSeriesThemeableOptions> = {
    colorScale: colorScaleOptionsDef,
    minStrokeWidth: positiveNumber,
    maxStrokeWidth: positiveNumber,
    itemStyler: callbackDefs<AgMapLineSeriesStyle>({
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    sizeDomain: and(arrayOf(positiveNumericValue), arrayLength(2, 2)),
    label: {
        ...seriesLabelOptionsDefs,
        ...labelCollisionFitOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(lineHighlightOptionsDef, lineHighlightOptionsDef),
};

export const mapLineBackgroundSeriesThemeableOptionsDef: OptionsDefs<AgMapLineBackgroundThemeableOptions> = {
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const mapMarkerSeriesThemeableOptionsDef: OptionsDefs<AgMapMarkerSeriesThemeableOptions> = {
    colorScale: colorScaleOptionsDef,
    minSize: positiveNumber,
    maxSize: positiveNumber,
    sizeDomain: and(arrayOf(positiveNumericValue), arrayLength(2, 2)),
    label: {
        placement: labelCollisionPlacementDef,
        spacing: positiveNumber,
        ...seriesLabelOptionsDefs,
        ...labelCollisionFitOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...without(markerOptionsDefs, ['enabled']),
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

export const mapShapeSeriesThemeableOptionsDef: OptionsDefs<AgMapShapeSeriesThemeableOptions> = {
    colorScale: colorScaleOptionsDef,
    padding: positiveNumber,
    itemStyler: callbackDefs<AgMapShapeSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    label: autoSizedLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

export const mapShapeBackgroundSeriesThemeableOptionsDef: OptionsDefs<AgMapShapeBackgroundThemeableOptions> = {
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const radialSeriesStylerDef = callbackDefs<AgRadialSeriesStyle>({
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
});

export const nightingaleSeriesThemeableOptionsDef: OptionsDefs<AgNightingaleSeriesThemeableOptions> = {
    cornerRadius: positiveNumber,
    styler: radialSeriesStylerDef,
    itemStyler: radialSeriesStylerDef,
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(barHighlightOptionsDef, barHighlightOptionsDef),
};

// TODO: duplicate series options defs here?
const networkSeriesTreeLayoutDef: OptionsDefs<AgNetworkSeriesTreeLayout> = {
    direction: union('down', 'left', 'right', 'up'),
    depthSpacing: number,
    innerSpacing: number,
    outerSpacing: number,
    verticalSpacing: deprecated(number, 'Use `depthSpacing` instead.'),
};

export const organizationSeriesThemeableOptionsDef: OptionsDefs<AgOrganizationSeriesThemeableOptions> = {
    ...commonSeriesThemeableOptionsDefs,
    ...networkSeriesTreeLayoutDef,
    direction: union('horizontal', 'vertical'),
    reverse: boolean,
    expander: defined,
    link: defined,
    node: defined,
    tooltip: tooltipOptionsDefs,
};

export const pyramidSeriesThemeableOptionsDef: OptionsDefs<AgPyramidSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    aspectRatio: positiveNumber,
    spacing: positiveNumber,
    reverse: boolean,
    itemStyler: callbackDefs<AgPyramidSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    label: seriesLabelOptionsDefs,
    stageLabel: {
        spacing: positiveNumber,
        placement: union('before', 'after'),
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    ...lineDashOptionsDef,
};

export const radarAreaSeriesThemeableOptionsDef: OptionsDefs<AgRadarAreaSeriesThemeableOptions> = {
    connectMissingData: boolean,
    marker: markerOptionsDefs,
    styler: callbackDefs<AgRadarAreaSeriesStyle>({
        marker: markerStyleOptionsDefs,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    label: {
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

Object.assign(radarAreaSeriesThemeableOptionsDef.label, undocumentedLabelFitOptionsDefs);

export const radarLineSeriesThemeableOptionsDef: OptionsDefs<AgRadarSeriesThemeableOptions> = {
    connectMissingData: boolean,
    marker: markerOptionsDefs,
    styler: callbackDefs<AgRadarSeriesStyle>({
        marker: markerStyleOptionsDefs,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    label: {
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, lineHighlightOptionsDef),
};

Object.assign(radarLineSeriesThemeableOptionsDef.label, undocumentedLabelFitOptionsDefs);

export const radialBarSeriesThemeableOptionsDef: OptionsDefs<AgRadialBarSeriesThemeableOptions> = {
    cornerRadius: positiveNumber,
    styler: radialSeriesStylerDef,
    itemStyler: radialSeriesStylerDef,
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(barHighlightOptionsDef, barHighlightOptionsDef),
};

export const radialColumnSeriesThemeableOptionsDef: OptionsDefs<AgRadialColumnSeriesThemeableOptions> = {
    cornerRadius: positiveNumber,
    columnWidthRatio: ratio,
    maxColumnWidthRatio: ratio,
    styler: radialSeriesStylerDef,
    itemStyler: radialSeriesStylerDef,
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(barHighlightOptionsDef, barHighlightOptionsDef),
};

const rangeAreaSeriesLineThemeableOptionsDef: OptionsDefs<AgRangeAreaSeriesLineThemeableOptions<unknown, unknown>> = {
    marker: markerOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const rangeAreaSeriesItemLineThemeableOptionsDef: OptionsDefs<
    AgRangeAreaSeriesItemLineThemeableOptions<unknown, unknown>
> = {
    marker: {
        enabled: boolean,
        ...markerStyleOptionsDefs,
    },
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const rangeAreaSeriesLineStyleDef: OptionsDefs<AgRangeAreaSeriesLineStyle> = {
    marker: markerStyleOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const rangeInsideOutsidePlacementDef = unionOrArray('inside', 'outside');
const waterfallPlacementDef = unionOrArray(
    'inside-start',
    'inside-center',
    'inside-end',
    'outside-start',
    'outside-end'
);

export const rangeAreaSeriesThemeableOptionsDef: OptionsDefs<AgRangeAreaSeriesThemeableOptions> = {
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationOptionsDefs,
    label: {
        ...seriesLabelOptionsDefs,
        ...labelCollisionFitOptionsDefs,
        ...labelPlacementStyleDefs,
        placement: rangeInsideOutsidePlacementDef,
        spacing: positiveNumber,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...rangeAreaSeriesLineThemeableOptionsDef,
    item: {
        low: { ...rangeAreaSeriesItemLineThemeableOptionsDef },
        high: { ...rangeAreaSeriesItemLineThemeableOptionsDef },
    },
    styler: callbackDefs<AgRangeAreaSeriesStyle>({
        ...fillOptionsDef,
        item: {
            low: { ...rangeAreaSeriesLineStyleDef },
            high: { ...rangeAreaSeriesLineStyleDef },
        },
    }),
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
    segmentation: shapeSegmentation,
    invertedStyle: {
        enabled: boolean,
        ...fillOptionsDef,
    },
};

const rangeBarStyleCallback = callbackDefs<AgRangeBarSeriesStyle>({
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
});

export const rangeBarSeriesThemeableOptionsDef: OptionsDefs<AgRangeBarSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    grouped: boolean,
    showInMiniChart: boolean,
    cornerRadius: positiveNumber,
    styler: rangeBarStyleCallback,
    itemStyler: rangeBarStyleCallback,
    label: {
        ...seriesLabelOptionsDefs,
        ...labelCollisionFitOptionsDefs,
        ...labelAutoFontSizeOptionsDefs,
        ...labelPlacementStyleDefs,
        placement: rangeInsideOutsidePlacementDef,
        orientation: labelOrientationDef,
        spacing: positiveNumber,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(barHighlightOptionsDef, barHighlightOptionsDef),
    segmentation: shapeSegmentation,
    width: positiveNumberNonZero,
    widthRatio: ratio,
};

export const sankeySeriesThemeableOptionsDef: OptionsDefs<AgSankeySeriesThemeableOptions> = {
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    label: {
        ...seriesLabelOptionsDefs,
        spacing: positiveNumber,
        placement: union('left', 'right', 'center'),
        edgePlacement: union('inside', 'outside'),
    },
    link: {
        itemStyler: callbackDefs<AgSankeySeriesLinkStyle>({
            ...fillOptionsDef,
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
        }),
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    node: {
        width: positiveNumber,
        spacing: positiveNumber,
        minSpacing: and(positiveNumber, lessThanOrEqual('spacing')),
        cornerRadius: positiveNumber,
        alignment: union('left', 'center', 'right', 'justify'),
        verticalAlignment: union('top', 'bottom', 'center'),
        sort: union('data', 'ascending', 'descending', 'auto'),
        itemStyler: callbackDefs<AgSankeySeriesNodeStyle>({
            ...fillOptionsDef,
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
        }),
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
};

Object.assign(sankeySeriesThemeableOptionsDef.label, undocumentedLabelFitOptionsDefs);

export const sunburstSeriesThemeableOptionsDef: OptionsDefs<AgSunburstSeriesThemeableOptions> = {
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    colorScale: colorScaleOptionsDef,
    sectorSpacing: positiveNumber,
    cornerRadius: positiveNumber,
    padding: positiveNumber,
    itemStyler: callbackDefs<AgSunburstSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
    }),
    label: {
        spacing: positiveNumber,
        ...autoSizedLabelOptionsDefs,
    },
    secondaryLabel: autoSizedLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...without(commonSeriesThemeableOptionsDefs, ['highlight', 'showInLegend']),
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    highlight: {
        enabled: boolean,
        highlightedItem: hierarchyHighlightStyleOptionsDef,
        highlightedBranch: hierarchyHighlightStyleOptionsDef,
        unhighlightedItem: hierarchyHighlightStyleOptionsDef,
        unhighlightedBranch: hierarchyHighlightStyleOptionsDef,
    },
};

export const treemapSeriesThemeableOptionsDef: OptionsDefs<AgTreemapSeriesThemeableOptions> = {
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    colorScale: colorScaleOptionsDef,
    itemStyler: callbackDefs<AgTreemapSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
    }),
    group: {
        gap: positiveNumber,
        padding: positiveNumber,
        cornerRadius: positiveNumber,
        textAlign: union('left', 'center', 'right'),
        interactive: boolean,
        highlight: {
            enabled: boolean,
            highlightedItem: hierarchyHighlightStyleOptionsDef,
            unhighlightedItem: hierarchyHighlightStyleOptionsDef,
        },
        label: {
            ...seriesLabelOptionsDefs,
            spacing: positiveNumber,
        },
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
    tile: {
        gap: positiveNumber,
        padding: positiveNumber,
        cornerRadius: positiveNumber,
        textAlign: union('left', 'center', 'right'),
        verticalAlign: union('top', 'middle', 'bottom'),
        label: {
            ...autoSizedLabelOptionsDefs,
            spacing: positiveNumber,
        },
        secondaryLabel: autoSizedLabelOptionsDefs,
        highlight: {
            enabled: boolean,
            highlightedItem: hierarchyHighlightStyleOptionsDef,
            highlightedBranch: hierarchyHighlightStyleOptionsDef,
            unhighlightedItem: hierarchyHighlightStyleOptionsDef,
            unhighlightedBranch: hierarchyHighlightStyleOptionsDef,
        },
        selection: selectionOptionsDef(hierarchySelectionStyleOptionsDef),
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...without(commonSeriesThemeableOptionsDefs, ['highlight', 'selection', 'showInLegend']),
};

const waterfallSeriesItemOptionsDef: OptionsDefs<AgWaterfallSeriesItemOptions<any>> = {
    name: string,
    cornerRadius: positiveNumber,
    itemStyler: callbackDefs<AgWaterfallSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
    }),
    label: {
        ...seriesLabelOptionsDefs,
        ...labelCollisionFitOptionsDefs,
        ...labelAutoFontSizeOptionsDefs,
        ...labelPlacementStyleDefs,
        placement: waterfallPlacementDef,
        orientation: labelOrientationDef,
        spacing: positiveNumber,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const waterfallSeriesThemeableOptionsDef: OptionsDefs<AgWaterfallSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    showInMiniChart: boolean,
    item: {
        positive: waterfallSeriesItemOptionsDef,
        negative: waterfallSeriesItemOptionsDef,
        total: waterfallSeriesItemOptionsDef,
    },
    line: {
        enabled: boolean,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    width: positiveNumberNonZero,
    widthRatio: ratio,
    ...commonSeriesThemeableOptionsDefs,
};
