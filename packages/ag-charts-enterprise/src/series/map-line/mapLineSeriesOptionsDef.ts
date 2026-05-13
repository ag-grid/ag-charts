import { type AgMapLineSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    commonSeriesOptionsDefs,
    constant,
    geoJson,
    required,
    string,
    without,
} from 'ag-charts-core';

const { mapLineSeriesThemeableOptionsDef } = _ModuleSupport;

export const mapLineSeriesOptionsDef: OptionsDefs<AgMapLineSeriesOptions> = {
    ...without(commonSeriesOptionsDefs, ['highlightStyle', 'highlight']),
    ...mapLineSeriesThemeableOptionsDef,
    type: required(constant('map-line')),
    idKey: required(string),
    sizeKey: string,
    colorKey: string,
    labelKey: string,
    idName: string,
    sizeName: string,
    colorName: string,
    labelName: string,
    topology: geoJson,
    topologyIdKey: string,
    legendItemName: string,
    title: string,
};
