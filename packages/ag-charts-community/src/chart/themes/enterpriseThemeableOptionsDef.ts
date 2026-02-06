import {
    type OptionsDefs,
    and,
    arrayOf,
    autoSizedLabelOptionsDefs,
    barHighlightOptionsDef,
    boolean,
    callbackDefs,
    color,
    colorUnion,
    commonSeriesThemeableOptionsDefs,
    fillOptionsDef,
    highlightOptionsDef,
    interpolationOptionsDefs,
    lessThanOrEqual,
    lineDashOptionsDef,
    lineHighlightOptionsDef,
    markerOptionsDefs,
    markerStyleOptionsDefs,
    multiSeriesHighlightOptionsDef,
    numberFormatValidator,
    positiveNumber,
    positiveNumberNonZero,
    ratio,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    shapeSegmentation,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    union,
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
    type AgNightingaleSeriesThemeableOptions,
    type AgOhlcSeriesItemOptions,
    type AgOhlcSeriesThemeableOptions,
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
    strokes: arrayOf(color),
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
        itemStyler: callbackDefs<AgChordSeriesNodeStyle>({
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

export const coneFunnelSeriesThemeableOptionsDef: OptionsDefs<AgConeFunnelSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
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
    strokes: arrayOf(color),
    itemStyler: callbackDefs<AgFunnelSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    spacingRatio: ratio,
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
    itemStyler: callbackDefs<AgHeatmapSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
    }),
    showInMiniChart: boolean,
    label: autoSizedLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
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
    maxStrokeWidth: positiveNumber,
    itemStyler: callbackDefs<AgMapLineSeriesStyle>({
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    sizeDomain: arrayOf(positiveNumber),
    label: seriesLabelOptionsDefs,
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
    colorRange: arrayOf(color),
    maxSize: positiveNumber,
    sizeDomain: arrayOf(positiveNumber),
    label: {
        placement: union('top', 'bottom', 'left', 'right'),
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...without(markerOptionsDefs, ['enabled']),
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

export const mapShapeSeriesThemeableOptionsDef: OptionsDefs<AgMapShapeSeriesThemeableOptions> = {
    colorRange: arrayOf(color),
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
    strokes: arrayOf(color),
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
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

export const radarLineSeriesThemeableOptionsDef: OptionsDefs<AgRadarSeriesThemeableOptions> = {
    connectMissingData: boolean,
    marker: markerOptionsDefs,
    styler: callbackDefs<AgRadarSeriesStyle>({
        marker: markerStyleOptionsDefs,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, lineHighlightOptionsDef),
};

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

export const rangeAreaSeriesThemeableOptionsDef: OptionsDefs<AgRangeAreaSeriesThemeableOptions> = {
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationOptionsDefs,
    label: {
        ...seriesLabelOptionsDefs,
        placement: union('inside', 'outside'),
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
        placement: union('inside', 'outside'),
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
    strokes: arrayOf(color),
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

export const sunburstSeriesThemeableOptionsDef: OptionsDefs<AgSunburstSeriesThemeableOptions> = {
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    colorRange: arrayOf(color),
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
        highlightedItem: hierarchyHighlightStyleOptionsDef,
        highlightedBranch: hierarchyHighlightStyleOptionsDef,
        unhighlightedItem: hierarchyHighlightStyleOptionsDef,
        unhighlightedBranch: hierarchyHighlightStyleOptionsDef,
    },
};

export const treemapSeriesThemeableOptionsDef: OptionsDefs<AgTreemapSeriesThemeableOptions> = {
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    colorRange: arrayOf(color),
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
            ...seriesLabelOptionsDefs,
            spacing: positiveNumber,
            lineHeight: positiveNumber,
            minimumFontSize: positiveNumber,
            wrapping: union('never', 'always', 'hyphenate', 'on-space'),
            overflowStrategy: union('ellipsis', 'hide'),
        },
        secondaryLabel: {
            ...seriesLabelOptionsDefs,
            lineHeight: positiveNumber,
            minimumFontSize: positiveNumber,
            wrapping: union('never', 'always', 'hyphenate', 'on-space'),
            overflowStrategy: union('ellipsis', 'hide'),
        },
        highlight: {
            highlightedItem: hierarchyHighlightStyleOptionsDef,
            highlightedBranch: hierarchyHighlightStyleOptionsDef,
            unhighlightedItem: hierarchyHighlightStyleOptionsDef,
            unhighlightedBranch: hierarchyHighlightStyleOptionsDef,
        },
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...without(commonSeriesThemeableOptionsDefs, ['highlight', 'showInLegend']),
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
        placement: union('inside-start', 'inside-center', 'inside-end', 'outside-start', 'outside-end'),
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
