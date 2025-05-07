import { type AgMapMarkerSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, constant, geoJson, required, string } from 'ag-charts-core';

const { commonSeriesOptionsDefs, mapMarkerSeriesThemeableOptionsDef, without } = _ModuleSupport;

export const mapMarkerSeriesOptionsDef: OptionsDefs<AgMapMarkerSeriesOptions> = {
    ...mapMarkerSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlightStyle']),
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
