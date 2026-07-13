import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    callbackOf,
    color,
    colorOrRef,
    colorUnion,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    fontOptionsDef,
    labelBoxOptionsDef,
    labelFitOptionsDefs,
    lineDashOptionsDef,
    multiSeriesHighlightOptionsDef,
    number,
    positiveNumber,
    ratio,
    required,
    selectionOptionsDef,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    textOrSegments,
    tooltipOptionsDefs,
    undocumented,
    without,
} from 'ag-charts-core';
import type {
    AgChartLabelStyleOptions,
    AgPieCalloutLineItemStylerResult,
    AgPieSeriesOptions,
    AgPieSeriesStyle,
    AgPieSeriesThemeableOptions,
    AgSelectionOptions,
    AgSelectionStyleOptions,
} from 'ag-charts-types';

const highlight = multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef);
const selection: OptionsDefs<AgSelectionOptions<AgSelectionStyleOptions>> = {
    ...selectionOptionsDef(shapeHighlightOptionsDef),
};
// @ts-expect-error undocumented option
selection.selectedOffset = undocumented(number);

export const pieSeriesThemeableOptionsDef: OptionsDefs<AgPieSeriesThemeableOptions> = {
    ...commonSeriesThemeableOptionsDefs,
    radiusMin: positiveNumber,
    radiusMax: positiveNumber,
    rotation: number,
    outerRadiusOffset: number,
    outerRadiusRatio: ratio,
    hideZeroValueSectorsInLegend: boolean,
    sectorSpacing: positiveNumber,
    cornerRadius: positiveNumber,
    itemStyler: callbackDefs<AgPieSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
    }),
    title: {
        enabled: boolean,
        text: string,
        showInLegend: boolean,
        spacing: positiveNumber,
        ...fontOptionsDef,
    },
    calloutLabel: {
        enabled: boolean,
        offset: number,
        minAngle: positiveNumber,
        avoidCollisions: boolean,
        formatter: callbackOf(textOrSegments),
        format: string,
        itemStyler: callbackDefs<AgChartLabelStyleOptions>({
            enabled: boolean,
            ...labelBoxOptionsDef,
            ...fontOptionsDef,
        }),
        ...labelFitOptionsDefs,
        ...labelBoxOptionsDef,
        ...fontOptionsDef,
    },
    sectorLabel: {
        enabled: boolean,
        positionOffset: number,
        positionRatio: ratio,
        formatter: callbackOf(textOrSegments),
        format: string,
        itemStyler: callbackDefs<AgChartLabelStyleOptions>({
            enabled: boolean,
            ...labelBoxOptionsDef,
            ...fontOptionsDef,
        }),
        ...labelFitOptionsDefs,
        ...labelBoxOptionsDef,
        ...fontOptionsDef,
    },
    calloutLine: {
        colors: arrayOf(colorOrRef),
        length: positiveNumber,
        strokeWidth: positiveNumber,
        itemStyler: callbackDefs<AgPieCalloutLineItemStylerResult>({
            color: colorOrRef,
            length: positiveNumber,
            strokeWidth: positiveNumber,
        }),
    },
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    highlight,
    selection,
    ...lineDashOptionsDef,
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
};

export const pieSeriesOptionsDef: OptionsDefs<AgPieSeriesOptions> = {
    ...pieSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('pie')),
    angleKey: required(string),
    radiusKey: string,
    calloutLabelKey: string,
    sectorLabelKey: string,
    legendItemKey: string,
    angleName: string,
    radiusName: string,
    calloutLabelName: string,
    sectorLabelName: string,
    highlight,
    selection,
};

// @ts-expect-error undocumented option
pieSeriesOptionsDef.angleFilterKey = undocumented(string);
// @ts-expect-error undocumented option
pieSeriesOptionsDef.defaultColorRange = undocumented(arrayOf(arrayOf(color)));
// @ts-expect-error undocumented option
pieSeriesOptionsDef.defaultPatternFills = undocumented(arrayOf(color));
// @ts-expect-error undocumented option
pieSeriesOptionsDef.title._enabledFromTheme = undocumented(boolean);
// @ts-expect-error undocumented option
pieSeriesOptionsDef.calloutLabel._enabledFromTheme = undocumented(boolean);
// @ts-expect-error undocumented option
pieSeriesOptionsDef.sectorLabel._enabledFromTheme = undocumented(boolean);
// @ts-expect-error undocumented option
pieSeriesOptionsDef.angleKeyAxis = undocumented(string);
// @ts-expect-error undocumented option
pieSeriesOptionsDef.radiusKeyAxis = undocumented(string);
