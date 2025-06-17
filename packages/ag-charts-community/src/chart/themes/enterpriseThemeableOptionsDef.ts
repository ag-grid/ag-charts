import {
    type OptionsDefs,
    arrayOf,
    barHighlightOptionsDef,
    boolean,
    callbackDefs,
    color,
    colorUnion,
    fillOptionsDef,
    fontOptionsDef,
    highlightOptionsDef,
    lineDashOptionsDef,
    lineHighlightOptionsDef,
    multiSeriesHighlightOptionsDef,
    number,
    positiveNumber,
    ratio,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';
import type {
    AgBaseAxisLabelStyleOptions,
    AgBoxPlotHighlightStyleOptions,
    AgBoxPlotSeriesStyle,
    AgBoxPlotSeriesThemeableOptions,
    AgCandlestickHighlightStyleOptions,
    AgCandlestickSeriesItemOptions,
    AgCandlestickSeriesThemeableOptions,
    AgChordSeriesLinkStyle,
    AgChordSeriesNodeStyle,
    AgChordSeriesThemeableOptions,
    AgConeFunnelSeriesThemeableOptions,
    AgFunnelSeriesStyle,
    AgFunnelSeriesThemeableOptions,
    AgHeatmapSeriesStyle,
    AgHeatmapSeriesThemeableOptions,
    AgMapLineBackgroundThemeableOptions,
    AgMapLineSeriesStyle,
    AgMapLineSeriesThemeableOptions,
    AgMapMarkerSeriesThemeableOptions,
    AgMapShapeBackgroundThemeableOptions,
    AgMapShapeSeriesStyle,
    AgMapShapeSeriesThemeableOptions,
    AgNightingaleSeriesThemeableOptions,
    AgOhlcSeriesItemOptions,
    AgOhlcSeriesThemeableOptions,
    AgPyramidSeriesStyle,
    AgPyramidSeriesThemeableOptions,
    AgRadarAreaSeriesThemeableOptions,
    AgRadarSeriesThemeableOptions,
    AgRadialBarSeriesThemeableOptions,
    AgRadialColumnSeriesThemeableOptions,
    AgRadialSeriesStyle,
    AgRangeAreaSeriesThemeableOptions,
    AgRangeBarSeriesStyle,
    AgRangeBarSeriesThemeableOptions,
    AgSankeySeriesLinkStyle,
    AgSankeySeriesNodeStyle,
    AgSankeySeriesThemeableOptions,
    AgSeriesHighlightStyle,
    AgSunburstSeriesStyle,
    AgSunburstSeriesThemeableOptions,
    AgTreemapSeriesStyle,
    AgTreemapSeriesThemeableOptions,
    AgWaterfallSeriesItemOptions,
    AgWaterfallSeriesStyle,
    AgWaterfallSeriesThemeableOptions,
} from 'ag-charts-types';

import { without } from '../../util/object';
import {
    autoSizedLabelOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    interpolationOptionsDefs,
    markerOptionsDefs,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    tooltipOptionsDefs,
} from '../commonOptionsDefs';

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

export const boxPlotSeriesThemeableOptionsDef: OptionsDefs<AgBoxPlotSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    showInMiniChart: boolean,
    itemStyler: callbackDefs<AgBoxPlotSeriesStyle>({
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
    }),
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...boxPlotStyleOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(boxPlotHighlightStyleOptionsDef, boxPlotHighlightStyleOptionsDef),
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
    showInMiniChart: boolean,
    label: {
        spacing: positiveNumber,
        placement: union('before', 'middle', 'after'),
        ...seriesLabelOptionsDefs,
    },
    stageLabel: {
        rotation: number,
        spacing: positiveNumber,
        minSpacing: positiveNumber,
        placement: union('before', 'after'),
        avoidCollisions: boolean,
        itemStyler: callbackDefs<AgBaseAxisLabelStyleOptions>({
            ...fontOptionsDef,
            spacing: number,
        }),
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    ...lineDashOptionsDef,
    highlight: highlightOptionsDef(lineHighlightOptionsDef),
};

export const funnelSeriesThemeableOptionsDef: OptionsDefs<AgFunnelSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    showInMiniChart: boolean,
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
        rotation: number,
        spacing: positiveNumber,
        minSpacing: positiveNumber,
        placement: union('before', 'after'),
        avoidCollisions: boolean,
        itemStyler: callbackDefs<AgBaseAxisLabelStyleOptions>({
            ...fontOptionsDef,
            spacing: number,
        }),
        ...seriesLabelOptionsDefs,
    },
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
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
    highlightStyle: {
        // eslint-disable-next-line sonarjs/deprecation
        ...(commonSeriesThemeableOptionsDefs.highlightStyle as OptionsDefs<AgSeriesHighlightStyle>),
        ...strokeOptionsDef,
    },
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
    // TODO Remove in next major version
    highlightStyle: {
        // eslint-disable-next-line sonarjs/deprecation
        ...(commonSeriesThemeableOptionsDefs.highlightStyle as OptionsDefs<AgSeriesHighlightStyle>),
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
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
    // TODO Remove in next major version
    highlightStyle: {
        // eslint-disable-next-line sonarjs/deprecation
        ...(commonSeriesThemeableOptionsDefs.highlightStyle as OptionsDefs<AgSeriesHighlightStyle>),
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

export const mapShapeBackgroundSeriesThemeableOptionsDef: OptionsDefs<AgMapShapeBackgroundThemeableOptions> = {
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const nightingaleSeriesThemeableOptionsDef: OptionsDefs<AgNightingaleSeriesThemeableOptions> = {
    cornerRadius: positiveNumber,
    itemStyler: callbackDefs<AgRadialSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
    }),
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
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, lineHighlightOptionsDef),
};

export const radialBarSeriesThemeableOptionsDef: OptionsDefs<AgRadialBarSeriesThemeableOptions> = {
    cornerRadius: positiveNumber,
    itemStyler: callbackDefs<AgRadialSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
    }),
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
    itemStyler: callbackDefs<AgRadialSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
    }),
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(barHighlightOptionsDef, barHighlightOptionsDef),
};

export const rangeAreaSeriesThemeableOptionsDef: OptionsDefs<AgRangeAreaSeriesThemeableOptions> = {
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationOptionsDefs,
    label: {
        ...seriesLabelOptionsDefs,
        padding: positiveNumber,
        placement: union('inside', 'outside'),
    },
    marker: markerOptionsDefs,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

export const rangeBarSeriesThemeableOptionsDef: OptionsDefs<AgRangeBarSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    showInMiniChart: boolean,
    cornerRadius: positiveNumber,
    itemStyler: callbackDefs<AgRangeBarSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
    }),
    label: {
        ...seriesLabelOptionsDefs,
        padding: positiveNumber,
        placement: union('inside', 'outside'),
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(barHighlightOptionsDef, barHighlightOptionsDef),
};

export const sankeySeriesThemeableOptionsDef: OptionsDefs<AgSankeySeriesThemeableOptions> = {
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    label: {
        ...seriesLabelOptionsDefs,
        spacing: positiveNumber,
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
        alignment: union('left', 'center', 'right', 'justify'),
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
    ...commonSeriesThemeableOptionsDefs,
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    // TODO Remove in next major version
    highlightStyle: {
        label: {
            color: color,
        },
        secondaryLabel: {
            color: color,
        },
        ...fillOptionsDef,
        ...strokeOptionsDef,
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
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    // TODO Remove in next major version
    highlightStyle: {
        group: {
            label: {
                color: color,
            },
            ...fillOptionsDef,
            ...strokeOptionsDef,
        },
        tile: {
            label: {
                color: color,
            },
            secondaryLabel: {
                color: color,
            },
            ...fillOptionsDef,
            ...strokeOptionsDef,
        },
    },
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
        padding: positiveNumber,
        placement: union('inside-start', 'inside-center', 'inside-end', 'outside-start', 'outside-end'),
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
    ...commonSeriesThemeableOptionsDefs,
};
