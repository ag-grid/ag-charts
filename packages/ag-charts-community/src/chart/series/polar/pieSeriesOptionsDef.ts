import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callback,
    color,
    colorUnion,
    constant,
    fillOptionsDef,
    fontOptionsDef,
    lineDashOptionsDef,
    number,
    positiveNumber,
    ratio,
    required,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';
import type { AgPieSeriesOptions } from 'ag-charts-types';

import { without } from '../../../util/object';
import { commonSeriesOptionsDefs, shadowOptionsDefs, tooltipOptionsDefs } from '../../commonOptionsDefs';

export const pieSeriesOptionsDef: OptionsDefs<AgPieSeriesOptions<never>> = {
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
    radiusMin: positiveNumber,
    radiusMax: positiveNumber,
    rotation: number,
    outerRadiusOffset: number,
    outerRadiusRatio: ratio,
    hideZeroValueSectorsInLegend: boolean,
    sectorSpacing: positiveNumber,
    cornerRadius: positiveNumber,
    itemStyler: callback,
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
        formatter: callback,
        ...fontOptionsDef,
    },
    sectorLabel: {
        enabled: boolean,
        positionOffset: number,
        positionRatio: ratio,
        formatter: callback,
        ...fontOptionsDef,
    },
    calloutLine: {
        colors: arrayOf(color),
        length: positiveNumber,
        strokeWidth: positiveNumber,
    },
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...lineDashOptionsDef,
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
};

// @ts-expect-error undocumented option
pieSeriesOptionsDef.defaultColorRange = arrayOf(arrayOf(color));
// @ts-expect-error undocumented option
pieSeriesOptionsDef.defaultPatternFills = arrayOf(color);
