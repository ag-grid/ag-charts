import { type AgRangeAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    commonSeriesOptionsDefs,
    constant,
    fillOptionsDef,
    number,
    required,
    shapeSegmentation,
    string,
    undocumented,
} from 'ag-charts-core';

const { rangeAreaSeriesThemeableOptionsDef } = _ModuleSupport;

export const rangeAreaSeriesOptionsDef: OptionsDefs<AgRangeAreaSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...rangeAreaSeriesThemeableOptionsDef,
    type: required(constant('range-area')),
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
    invertedStyle: {
        enabled: boolean,
        ...fillOptionsDef,
    },
};

// @ts-expect-error undocumented option
rangeAreaSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
rangeAreaSeriesOptionsDef.focusPriority = undocumented(number);
