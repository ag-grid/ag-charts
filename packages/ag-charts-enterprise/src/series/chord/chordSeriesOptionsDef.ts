import type { AgChordSeriesOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    callbackOf,
    chordSeriesThemeableOptionsDef,
    commonSeriesOptionsDefs,
    constant,
    fillGradientDefaults,
    fillImageDefaults,
    fillPatternDefaults,
    required,
    string,
    undocumented,
    without,
} from 'ag-charts-core';

export const chordSeriesOptionsDef: OptionsDefs<AgChordSeriesOptions> = {
    ...chordSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlight']),
    type: required(constant('chord')),
    fromKey: required(string),
    toKey: required(string),
    sizeKey: string,
    sizeName: string,
    getItemId: callbackOf(string),
};

// @ts-expect-error undocumented option
chordSeriesOptionsDef.fillGradientDefaults = undocumented(fillGradientDefaults);
// @ts-expect-error undocumented option
chordSeriesOptionsDef.fillPatternDefaults = undocumented(fillPatternDefaults);
// @ts-expect-error undocumented option
chordSeriesOptionsDef.fillImageDefaults = undocumented(fillImageDefaults);
