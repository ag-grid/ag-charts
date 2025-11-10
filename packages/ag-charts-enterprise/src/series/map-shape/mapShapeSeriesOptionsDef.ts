import { type AgMapShapeSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, constant, geoJson, required, string, without} from 'ag-charts-core';

const { commonSeriesOptionsDefs, mapShapeSeriesThemeableOptionsDef } = _ModuleSupport;

export const mapShapeSeriesOptionsDef: OptionsDefs<AgMapShapeSeriesOptions> = {
    ...without(commonSeriesOptionsDefs, ['highlightStyle', 'highlight']),
    ...mapShapeSeriesThemeableOptionsDef,
    type: required(constant('map-shape')),
    idKey: required(string),
    colorKey: string,
    labelKey: string,
    idName: string,
    colorName: string,
    labelName: string,
    topology: geoJson,
    topologyIdKey: string,
    legendItemName: string,
    title: string,
};
