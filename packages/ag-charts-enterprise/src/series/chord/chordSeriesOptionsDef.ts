import { type AgChordSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    commonSeriesOptionsDefs,
    constant,
    fillGradientDefaults,
    fillImageDefaults,
    fillPatternDefaults,
    required,
    string,
    undocumented,
} from 'ag-charts-core';

const { chordSeriesThemeableOptionsDef } = _ModuleSupport;

export const chordSeriesOptionsDef: OptionsDefs<AgChordSeriesOptions> = {
    ...chordSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('chord')),
    fromKey: required(string),
    toKey: required(string),
    sizeKey: string,
    sizeName: string,
};

// @ts-expect-error undocumented option
chordSeriesOptionsDef.fillGradientDefaults = undocumented(fillGradientDefaults);
// @ts-expect-error undocumented option
chordSeriesOptionsDef.fillPatternDefaults = undocumented(fillPatternDefaults);
// @ts-expect-error undocumented option
chordSeriesOptionsDef.fillImageDefaults = undocumented(fillImageDefaults);
