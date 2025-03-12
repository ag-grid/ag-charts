import { type AgMapMarkerSeriesOptions, type AgSeriesHighlightStyle, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    color,
    constant,
    fillOptionsDef,
    object,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, markerOptionsDefs, seriesLabelOptionsDefs, tooltipOptionsDefs, without } =
    _ModuleSupport;

export const mapMarkerSeriesOptionsDef: OptionsDefs<AgMapMarkerSeriesOptions> = {
    type: required(constant('map-marker')),
    // TODO idKey OR latitudeKey & longitudeKey should be required - support for such conditions needed
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
    topology: object,
    topologyIdKey: string,
    legendItemName: string,
    colorRange: arrayOf(color),
    title: string,
    maxSize: positiveNumber,
    sizeDomain: arrayOf(positiveNumber),
    label: {
        placement: union('top', 'bottom', 'left', 'right'),
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...without(markerOptionsDefs, ['enabled']),
    highlightStyle: {
        ...(commonSeriesOptionsDefs.highlightStyle as OptionsDefs<AgSeriesHighlightStyle>),
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
};
