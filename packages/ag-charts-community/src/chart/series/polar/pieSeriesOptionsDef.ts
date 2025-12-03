import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    callbackOf,
    color,
    colorUnion,
    constant,
    fillOptionsDef,
    fontOptionsDef,
    labelBoxOptionsDef,
    lineDashOptionsDef,
    multiSeriesHighlightOptionsDef,
    number,
    positiveNumber,
    ratio,
    required,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    undocumented,
    without,
} from 'ag-charts-core';
import type {
    AgChartLabelStyleOptions,
    AgPieCalloutLineItemStylerResult,
    AgPieSeriesOptions,
    AgPieSeriesStyle,
    AgPieSeriesThemeableOptions,
} from 'ag-charts-types';

import {
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    shadowOptionsDefs,
    textOrSegments,
    tooltipOptionsDefs,
} from 'ag-charts-core';

const highlight = multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef);

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
        ...labelBoxOptionsDef,
        ...fontOptionsDef,
    },
    calloutLine: {
        colors: arrayOf(color),
        length: positiveNumber,
        strokeWidth: positiveNumber,
        itemStyler: callbackDefs<AgPieCalloutLineItemStylerResult>({
            color,
            length: positiveNumber,
            strokeWidth: positiveNumber,
        }),
    },
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    highlight,
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
    angleKeyAxis: string,
    radiusKeyAxis: string,
    calloutLabelKey: string,
    sectorLabelKey: string,
    legendItemKey: string,
    angleName: string,
    radiusName: string,
    calloutLabelName: string,
    sectorLabelName: string,
    highlight,
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
