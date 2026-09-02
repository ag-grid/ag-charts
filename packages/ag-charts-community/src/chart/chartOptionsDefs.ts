import {
    type OptionsDefs,
    array,
    arrayOf,
    arrayOfDefs,
    boolean,
    borderOptionsDef,
    callback,
    commonChartOptionsDefs,
    defined,
    fillOptionsDef,
    geoJson,
    htmlElement,
    nonNegativeInteger,
    number,
    object,
    or,
    padding,
    positiveNumber,
    required,
    strictUnion,
    string,
    strokeOptionsDef,
    themeOperator,
    undocumented,
    union,
} from 'ag-charts-core';
import type {
    AgActiveItemState,
    AgActiveState,
    AgCartesianChartOptions,
    AgChartValidationLevel,
    AgInitialStateLegendOptions,
    AgPolarChartOptions,
    AgSeriesAreaBackgroundRegion,
    AgStandaloneChartOptions,
    AgTopologyChartOptions,
} from 'ag-charts-types';

import { seriesAreaBackgroundRegionLabelDef, seriesAreaBackgroundRegionRangeDef } from './themes/themeOptionsDef';

export const initialStatePickedOptionsDef: OptionsDefs<AgActiveState> = {
    activeItem: {
        type: required(strictUnion<AgActiveItemState['type']>()('series-node', 'legend')),
        seriesId: string,
        itemId: required(or(string, positiveNumber)),
    },
    frozen: boolean,
};

// Exhaustive against the public option type, so neither side can gain a severity without the other.
// Strict, so an array carrying an unrecognised severity is rejected whole and diagnosed, rather than
// having that element silently dropped: a bare union validator returns a boolean, which `arrayOf`
// cannot turn into a per-element diagnostic.
const validationLevels = arrayOf(
    strictUnion<AgChartValidationLevel>()('error', 'warning', 'deprecation'),
    "an array of validation severities ('error', 'warning' or 'deprecation')"
);

// These options are being validated by other modules
export const commonChartOptions = {
    mode: undocumented(union('integrated', 'standalone')),
    withinStudio: undocumented(boolean),
    loading: boolean,
    validations: {
        showOverlayOn: validationLevels,
        consoleOn: validationLevels,
        throwOn: validationLevels,
        onDiagnosticRaised: callback,
    },
    container: htmlElement,
    context: () => true,
    theme: defined,
    series: array,
    annotations: object,
    navigator: object,
    scrollbar: object,
    initialState: {
        active: initialStatePickedOptionsDef,
        chartType: string,
        collapsed: arrayOf(or(string, number)),
        annotations: defined,
        legend: arrayOfDefs<AgInitialStateLegendOptions>(
            {
                visible: boolean,
                seriesId: string,
                itemId: string,
                legendItemName: string,
            },
            'legend state array'
        ),
        legendPagination: nonNegativeInteger,
        zoom: defined,
    },
};

export const cartesianChartOptionsDefs: OptionsDefs<AgCartesianChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    axes: object,
    data: array,
    dataIdKey: string,
    seriesArea: {
        border: borderOptionsDef,
        clip: boolean,
        cornerRadius: number,
        padding: or(themeOperator, padding),
        backgroundRegions: arrayOfDefs<AgSeriesAreaBackgroundRegion>({
            ...fillOptionsDef,
            ...strokeOptionsDef,
            xRange: seriesAreaBackgroundRegionRangeDef,
            yRange: seriesAreaBackgroundRegionRangeDef,
            label: seriesAreaBackgroundRegionLabelDef,
        }),
    },
};

export const polarChartOptionsDefs: OptionsDefs<AgPolarChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    axes: object,
    data: array,
    dataIdKey: string,
};

export const topologyChartOptionsDefs: OptionsDefs<AgTopologyChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
    dataIdKey: string,
    topology: geoJson,
};

export const standaloneChartOptionsDefs: OptionsDefs<AgStandaloneChartOptions> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
    dataIdKey: string,
};
