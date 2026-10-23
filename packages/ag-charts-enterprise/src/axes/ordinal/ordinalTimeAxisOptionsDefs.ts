import type { AgOrdinalTimeAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    type WithoutCrossLineOptions,
    boolean,
    cartesianAxisBandHighlightOptions,
    cartesianAxisCrosshairOptions,
    cartesianAxisOptionsDefs,
    cartesianTimeAxisLabel,
    cartesianTimeAxisParentLevel,
    constant,
    discreteTimeAxisIntervalOptionsDefs,
    ratio,
    union,
} from 'ag-charts-core';

export const ordinalTimeAxisOptionsDefs: OptionsDefs<WithoutCrossLineOptions<AgOrdinalTimeAxisOptions>> = {
    ...cartesianAxisOptionsDefs,
    type: constant('ordinal-time'),
    paddingInner: ratio,
    paddingOuter: ratio,
    groupPaddingInner: ratio,
    label: cartesianTimeAxisLabel,
    parentLevel: cartesianTimeAxisParentLevel,
    interval: discreteTimeAxisIntervalOptionsDefs,
    crosshair: cartesianAxisCrosshairOptions(true, true),
    bandHighlight: cartesianAxisBandHighlightOptions,
    bandAlignment: union('justify', 'start', 'center', 'end'),
    skipNullBars: boolean,
};
