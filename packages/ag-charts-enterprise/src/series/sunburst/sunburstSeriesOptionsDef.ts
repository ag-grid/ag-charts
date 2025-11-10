import { type AgSunburstSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, constant, required, string, without } from 'ag-charts-core';

const { commonSeriesOptionsDefs, sunburstSeriesThemeableOptionsDef } = _ModuleSupport;

export const sunburstSeriesOptionsDef: OptionsDefs<AgSunburstSeriesOptions> = {
    ...sunburstSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlightStyle', 'highlight', 'showInLegend']),
    type: required(constant('sunburst')),
    labelKey: string,
    secondaryLabelKey: string,
    childrenKey: string,
    sizeKey: string,
    colorKey: string,
    sizeName: string,
    colorName: string,
};
