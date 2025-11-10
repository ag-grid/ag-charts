import { type AgMapMarkerSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, constant, geoJson, required, string, without } from 'ag-charts-core';

const { commonSeriesOptionsDefs, mapMarkerSeriesThemeableOptionsDef } = _ModuleSupport;

export const mapMarkerSeriesOptionsDef: OptionsDefs<AgMapMarkerSeriesOptions> = {
    ...without(commonSeriesOptionsDefs, ['highlightStyle', 'highlight']),
    ...mapMarkerSeriesThemeableOptionsDef,
    type: required(constant('map-marker')),
    idKey: string,
    latitudeKey: string,
    longitudeKey: string,
    sizeKey: string,
    colorKey: string,
    labelKey: string,
    idName: string,
    latitudeName: string,
    longitudeName: string,
    sizeName: string,
    colorName: string,
    labelName: string,
    topology: geoJson,
    topologyIdKey: string,
    legendItemName: string,
    title: string,
};
