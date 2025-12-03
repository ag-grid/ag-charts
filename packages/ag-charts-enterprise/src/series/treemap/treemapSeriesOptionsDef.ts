import { type AgTreemapSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    color,
    commonSeriesOptionsDefs,
    constant,
    required,
    string,
    undocumented,
    without,
} from 'ag-charts-core';

const { treemapSeriesThemeableOptionsDef } = _ModuleSupport;

export const treemapSeriesOptionsDef: OptionsDefs<AgTreemapSeriesOptions> = {
    ...treemapSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlightStyle', 'highlight', 'showInLegend']),
    type: required(constant('treemap')),
    labelKey: string,
    secondaryLabelKey: string,
    childrenKey: string,
    sizeKey: string,
    colorKey: string,
    sizeName: string,
    colorName: string,
};

// @ts-expect-error undocumented option
treemapSeriesOptionsDef.undocumentedGroupFills = undocumented(arrayOf(color));
// @ts-expect-error undocumented option
treemapSeriesOptionsDef.undocumentedGroupStrokes = undocumented(arrayOf(color));
