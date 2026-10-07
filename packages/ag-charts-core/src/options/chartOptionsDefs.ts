import type {
    AgActiveItemState,
    AgActiveState,
    AgBaseThemeableChartOptions,
    AgCartesianChartOptions,
    AgCartesianSeriesAreaThemableOptions,
    AgChartValidationSeverity,
    AgChartValidationsOptions,
    AgCommonThemeableChartOptions,
    AgInitialStateLegendOptions,
    AgPolarChartOptions,
    AgStandaloneChartOptions,
    AgStateSerializableDate,
    AgTopologyChartOptions,
} from 'ag-charts-types';

import { type ModuleOwnedChartOptions, commonChartOptionsDefs } from './chartDefaults';
import { geoJson } from './geoJsonValidator';
import { borderOptionsDef, padding, themeOperator } from './optionsDefaults';
import {
    type OptionsDefs,
    array,
    arrayOf,
    arrayOfDefs,
    boolean,
    callback,
    constant,
    defined,
    htmlElement,
    nonNegativeInteger,
    number,
    object,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    strictUnion,
    string,
    undocumented,
} from './validation';

/** `seriesArea.backgroundRegions` is owned by the enterprise background regions module. */
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

export const validationsOptionsDef: OptionsDefs<AgChartValidationsOptions> = {
    showOverlayOn: validationSeverities,
    consoleOn: validationSeverities,
    throwOn: validationSeverities,
    issueRaised: callback,
};

const initialStateLegendOptionsDef = arrayOfDefs<AgInitialStateLegendOptions>(
    {
        visible: boolean,
        seriesId: string,
        itemId: string,
        legendItemName: string,
    },
    'legend state array'
);

// These options are being validated by other modules
export const commonChartOptions = {
    withinStudio: undocumented(boolean),
    loading: boolean,
    validations: validationsOptionsDef,
    container: htmlElement,
    context: () => true,
    theme: defined,
    series: array,
    initialState: {
        active: initialStatePickedOptionsDef,
        chartType: string,
        collapsed: arrayOf(or(string, number)),
        annotations: defined,
        legend: initialStateLegendOptionsDef,
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

const serializableDate = optionsDefs<AgStateSerializableDate>(
    {
        __type: required(constant('date')),
        value: or(string, number),
    },
    'a serializable date object'
);

const zoomRangeDef = { start: or(number, serializableDate), end: or(number, serializableDate) };
const zoomRatioDef = { start: ratio, end: ratio };

export const cartesianChartThemeOptionsDefs: OptionsDefs<Omit<AgBaseThemeableChartOptions, ModuleOwnedChartOptions>> = {
    ...commonChartOptionsDefs,
};
// @ts-expect-error undocumented option, required by integrated charts
cartesianChartThemeOptionsDefs.paired = undocumented(boolean);

/** Theme overrides under `common`; axes and module-owned keys are composed in from the registered modules. */
export const commonThemeOverridesOptionsDefs: OptionsDefs<
    Omit<AgCommonThemeableChartOptions, ModuleOwnedChartOptions | 'axes'>
> = {
    ...commonChartOptionsDefs,
    initialState: {
        legend: initialStateLegendOptionsDef,
        zoom: {
            rangeX: zoomRangeDef,
            rangeY: zoomRangeDef,
            ratioX: zoomRatioDef,
            ratioY: zoomRatioDef,
            autoScaledAxes: arrayOf(constant('y')),
        },
    },
    validations: validationsOptionsDef,
};
