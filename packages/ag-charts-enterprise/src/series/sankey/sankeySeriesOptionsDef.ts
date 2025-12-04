import { type AgSankeySeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    color,
    commonSeriesOptionsDefs,
    constant,
    fillGradientDefaults,
    fillImageDefaults,
    fillPatternDefaults,
    required,
    string,
    undocumented,
} from 'ag-charts-core';

const { sankeySeriesThemeableOptionsDef } = _ModuleSupport;

export const sankeySeriesOptionsDef: OptionsDefs<AgSankeySeriesOptions> = {
    ...sankeySeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('sankey')),
    fromKey: required(string),
    toKey: required(string),
    sizeKey: string,
    sizeName: string,
};

// @ts-expect-error undocumented option
sankeySeriesOptionsDef.fillGradientDefaults = undocumented(fillGradientDefaults);
// @ts-expect-error undocumented option
sankeySeriesOptionsDef.fillPatternDefaults = undocumented(fillPatternDefaults);
// @ts-expect-error undocumented option
sankeySeriesOptionsDef.fillImageDefaults = undocumented(fillImageDefaults);
// @ts-expect-error undocumented option
sankeySeriesOptionsDef.defaultColorRange = undocumented(arrayOf(arrayOf(color)));
// @ts-expect-error undocumented option
sankeySeriesOptionsDef.defaultPatternFills = undocumented(arrayOf(color));
