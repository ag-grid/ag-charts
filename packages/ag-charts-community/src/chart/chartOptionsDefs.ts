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
    themeOperator,
    undocumented,
    union,
} from 'ag-charts-core';
import type {
    AgActiveItemState,
    AgActiveState,
    AgCartesianChartOptions,
    AgCartesianSeriesAreaThemableOptions,
    AgChartValidationSeverity,
    AgInitialStateLegendOptions,
    AgPolarChartOptions,
    AgStandaloneChartOptions,
    AgTopologyChartOptions,
} from 'ag-charts-types';

/** Chart-level keys owned by plugin modules; their defs arrive through the modules' contributions. */
export type ModuleOwnedChartOptions = 'annotations' | 'navigator' | 'scrollbar';

/** `seriesArea.backgroundRegions` is owned by the enterprise series area module. */
export type CartesianChartDefOptions = Omit<AgCartesianChartOptions, ModuleOwnedChartOptions | 'seriesArea'> & {
    seriesArea?: Omit<AgCartesianSeriesAreaThemableOptions, 'backgroundRegions'>;
};

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
const validationSeverities = arrayOf(
    strictUnion<AgChartValidationSeverity>()('error', 'warning', 'deprecation'),
    "an array of validation severities ('error', 'warning' or 'deprecation')"
);

// These options are being validated by other modules
export const commonChartOptions = {
    mode: undocumented(union('integrated', 'standalone')),
    withinStudio: undocumented(boolean),
    loading: boolean,
    validations: {
        showOverlayOn: validationSeverities,
        consoleOn: validationSeverities,
        throwOn: validationSeverities,
        issueRaised: callback,
    },
    container: htmlElement,
    context: () => true,
    theme: defined,
    series: array,
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

export const cartesianChartOptionsDefs: OptionsDefs<CartesianChartDefOptions> = {
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
    },
};

export const polarChartOptionsDefs: OptionsDefs<Omit<AgPolarChartOptions, ModuleOwnedChartOptions>> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    axes: object,
    data: array,
    dataIdKey: string,
};

export const topologyChartOptionsDefs: OptionsDefs<Omit<AgTopologyChartOptions, ModuleOwnedChartOptions>> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
    dataIdKey: string,
    topology: geoJson,
};

export const standaloneChartOptionsDefs: OptionsDefs<Omit<AgStandaloneChartOptions, ModuleOwnedChartOptions>> = {
    ...commonChartOptionsDefs,
    ...commonChartOptions,
    data: array,
    dataIdKey: string,
};
