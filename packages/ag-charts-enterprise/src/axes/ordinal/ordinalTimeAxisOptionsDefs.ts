import type { AgOrdinalTimeAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOfDefs,
    boolean,
    cartesianAxisBandHighlightOptions,
    cartesianAxisCrosshairOptions,
    cartesianAxisOptionsDefs,
    cartesianCrossLineLabelOptionsDefs,
    cartesianTimeAxisLabel,
    cartesianTimeAxisParentLevel,
    constant,
    crossLineOptionsDefs,
    date,
    discreteTimeAxisIntervalOptionsDefs,
    numericValue,
    or,
    ratio,
    union,
} from 'ag-charts-core';

export const ordinalTimeAxisOptionsDefs: OptionsDefs<AgOrdinalTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: constant('ordinal-time'),
    paddingInner: ratio,
    paddingOuter: ratio,
    groupPaddingInner: ratio,
    label: cartesianTimeAxisLabel,
    parentLevel: cartesianTimeAxisParentLevel,
    interval: discreteTimeAxisIntervalOptionsDefs,
    crosshair: cartesianAxisCrosshairOptions(true, true),
    crossLines: arrayOfDefs(
        crossLineOptionsDefs(or(numericValue, date), cartesianCrossLineLabelOptionsDefs),
        'a cross-line options array'
    ),
    bandHighlight: cartesianAxisBandHighlightOptions,
    bandAlignment: union('justify', 'start', 'center', 'end'),
    skipNullBars: boolean,
};
