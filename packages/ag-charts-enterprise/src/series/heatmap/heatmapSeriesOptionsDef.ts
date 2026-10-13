import type {
    AgHeatmapSeriesLabelStyle,
    AgHeatmapSeriesOptions,
    AgHeatmapSeriesStyle,
    AgHeatmapSeriesThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    autoSizedLabelOptionsDefs,
    boolean,
    callbackDefs,
    colorScaleOptionsDef,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    deprecated,
    fillOptionsDef,
    fontOptionsDef,
    labelBoxOptionsDef,
    positiveNumber,
    required,
    shadowHighlightOptionsDef,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    textAlign,
    tooltipOptionsDefs,
    union,
    without,
} from 'ag-charts-core';

export const heatmapSeriesThemeableOptionsDef: OptionsDefs<AgHeatmapSeriesThemeableOptions> = {
    title: string,
    textAlign: deprecated(textAlign, 'Use `label.textAlign` instead.'),
    verticalAlign: deprecated(union('top', 'middle', 'bottom'), 'Use `label.verticalAlign` instead.'),
    itemPadding: positiveNumber,
    cornerRadius: positiveNumber,
    shadow: shadowOptionsDefs,
    itemStyler: callbackDefs<AgHeatmapSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
    }),
    showInMiniChart: boolean,
    label: {
        ...autoSizedLabelOptionsDefs,
        // The full `textAlign` union: the deprecated top-level option forwards into here, so it must
        // still accept the `start`/`end` values that option supports.
        textAlign,
        verticalAlign: union('top', 'middle', 'bottom'),
        itemStyler: callbackDefs<AgHeatmapSeriesLabelStyle>({
            enabled: boolean,
            ...labelBoxOptionsDef,
            ...fontOptionsDef,
            textAlign,
            verticalAlign: union('top', 'middle', 'bottom'),
        }),
    },
    tooltip: tooltipOptionsDefs,
    colorScale: colorScaleOptionsDef,
    ...commonSeriesThemeableOptionsDefs,
    highlight: shadowHighlightOptionsDef(shapeHighlightOptionsDef),
    ...strokeOptionsDef,
};

export const heatmapSeriesOptionsDef: OptionsDefs<AgHeatmapSeriesOptions> = {
    ...without(heatmapSeriesThemeableOptionsDef, ['showInLegend']),
    ...without(commonSeriesOptionsDefs, ['showInLegend', 'highlight']),
    type: required(constant('heatmap')),
    xKey: required(string),
    yKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    colorKey: string,
    xName: string,
    yName: string,
    colorName: string,
    colorScale: colorScaleOptionsDef,
};
