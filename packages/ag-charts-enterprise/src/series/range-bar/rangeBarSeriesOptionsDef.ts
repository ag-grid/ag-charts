import { type AgRangeBarSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    commonSeriesOptionsDefs,
    constant,
    number,
    positiveNumberNonZero,
    ratio,
    required,
    shapeSegmentation,
    string,
    undocumented,
} from 'ag-charts-core';

const { rangeBarSeriesThemeableOptionsDef } = _ModuleSupport;

export const rangeBarSeriesOptionsDef: OptionsDefs<AgRangeBarSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...rangeBarSeriesThemeableOptionsDef,
    type: required(constant('range-bar')),
    xKey: required(string),
    yLowKey: required(string),
    yHighKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    yLowName: string,
    yHighName: string,
    legendItemName: string,
    segmentation: shapeSegmentation,
    width: positiveNumberNonZero,
    widthRatio: ratio,
    minWidth: positiveNumberNonZero,
    maxWidth: positiveNumberNonZero,
};

// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.focusPriority = undocumented(number);
