import type { AgRadialBarSeriesOptions, AgRadialBarSeriesThemeableOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    barHighlightOptionsDef,
    boolean,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    multiSeriesHighlightOptionsDef,
    number,
    positiveNumber,
    required,
    seriesLabelOptionsDefs,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumented,
} from 'ag-charts-core';

import { radialSeriesStylerDef } from '../radial-column/radialColumnSeriesOptionsDef';

export const radialBarSeriesThemeableOptionsDef: OptionsDefs<AgRadialBarSeriesThemeableOptions> = {
    cornerRadius: positiveNumber,
    styler: radialSeriesStylerDef,
    itemStyler: radialSeriesStylerDef,
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(barHighlightOptionsDef, barHighlightOptionsDef),
};

export const radialBarSeriesOptionsDef: OptionsDefs<AgRadialBarSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...radialBarSeriesThemeableOptionsDef,
    type: required(constant('radial-bar')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    legendItemName: string,
    grouped: boolean,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
};

// @ts-expect-error undocumented option
radialBarSeriesOptionsDef.angleKeyAxis = undocumented(string);
// @ts-expect-error undocumented option
radialBarSeriesOptionsDef.radiusKeyAxis = undocumented(string);
