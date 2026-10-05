import type { AgSankeySeriesOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    callbackOf,
    color,
    commonSeriesOptionsDefs,
    constant,
    fillGradientDefaults,
    fillImageDefaults,
    fillPatternDefaults,
    required,
    sankeySeriesThemeableOptionsDef,
    string,
    undocumented,
    without,
} from 'ag-charts-core';

export const sankeySeriesOptionsDef: OptionsDefs<AgSankeySeriesOptions> = {
    ...sankeySeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlight']),
    type: required(constant('sankey')),
    fromKey: required(string),
    toKey: required(string),
    sizeKey: string,
    sizeName: string,
    getItemId: callbackOf(string),
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
