import { type AgMapLineSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    and,
    arrayLength,
    arrayOf,
    color,
    constant,
    geoJson,
    required,
    string,
    undocumented,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, mapLineSeriesThemeableOptionsDef, without } = _ModuleSupport;

export const mapLineSeriesOptionsDef: OptionsDefs<AgMapLineSeriesOptions> = {
    ...mapLineSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlightStyle']),
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

// @ts-expect-error undocumented option
mapLineSeriesOptionsDef.colorRange = undocumented(and(arrayOf(color), arrayLength(1)));
