import type { AgRangeBarSeriesOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    commonSeriesOptionsDefs,
    constant,
    number,
    positiveNumberNonZero,
    rangeBarSeriesThemeableOptionsDef,
    ratio,
    required,
    shapeSegmentation,
    string,
    undocumented,
} from 'ag-charts-core';

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
};

// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.focusPriority = undocumented(number);
