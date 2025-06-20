import { type AgTreemapSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    color,
    constant,
    fillGradientDefaults,
    fillImageDefaults,
    fillPatternDefaults,
    required,
    string,
    undocumented,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, treemapSeriesThemeableOptionsDef, without } = _ModuleSupport;

export const treemapSeriesOptionsDef: OptionsDefs<AgTreemapSeriesOptions> = {
    ...treemapSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlightStyle', 'highlight']),
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
treemapSeriesOptionsDef.fillGradientDefaults = undocumented(fillGradientDefaults);
// @ts-expect-error undocumented option
treemapSeriesOptionsDef.fillPatternDefaults = undocumented(fillPatternDefaults);
// @ts-expect-error undocumented option
treemapSeriesOptionsDef.fillImageDefaults = undocumented(fillImageDefaults);
// @ts-expect-error undocumented option
treemapSeriesOptionsDef.undocumentedGroupFills = undocumented(arrayOf(color));
// @ts-expect-error undocumented option
treemapSeriesOptionsDef.undocumentedGroupStrokes = undocumented(arrayOf(color));
