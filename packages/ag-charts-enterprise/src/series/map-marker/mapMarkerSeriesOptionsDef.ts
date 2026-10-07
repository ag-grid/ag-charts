import type { AgMapMarkerSeriesOptions, AgMapMarkerSeriesThemeableOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    and,
    arrayLength,
    arrayOf,
    colorScaleOptionsDef,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    geoJson,
    labelCollisionFitOptionsDefs,
    labelCollisionPlacementDef,
    markerOptionsDefs,
    multiSeriesShadowHighlightOptionsDef,
    positiveNumber,
    positiveNumericValue,
    required,
    seriesLabelOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    tooltipOptionsDefs,
    undocumented,
    union,
    without,
} from 'ag-charts-core';

export const mapMarkerSeriesThemeableOptionsDef: OptionsDefs<AgMapMarkerSeriesThemeableOptions> = {
    colorScale: colorScaleOptionsDef,
    minSize: positiveNumber,
    maxSize: positiveNumber,
    sizeDomain: and(arrayOf(positiveNumericValue), arrayLength(2, 2)),
    sizeMode: union('diameter', 'area'),
    label: {
        placement: labelCollisionPlacementDef,
        spacing: positiveNumber,
        ...seriesLabelOptionsDefs,
        ...labelCollisionFitOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...without(markerOptionsDefs, ['enabled']),
    highlight: multiSeriesShadowHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

// @ts-expect-error undocumented option
mapMarkerSeriesThemeableOptionsDef.topologyIdKey = undocumented(string);

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
