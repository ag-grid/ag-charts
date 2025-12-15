import { type AgChordSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, commonSeriesOptionsDefs, constant, required, string } from 'ag-charts-core';

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
