import { type AgSankeySeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, commonSeriesOptionsDefs, constant, required, string } from 'ag-charts-core';

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
