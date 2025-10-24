import {
    type AxisModuleDefinition,
    and,
    constant,
    date,
    greaterThan,
    lessThan,
    number,
    or,
    ratio,
    required,
} from 'ag-charts-core';
import type { AgUnitTimeAxisOptions } from 'ag-charts-types';

import {
    cartesianAxisBandHighlightOptions,
    cartesianAxisCrosshairOptions,
    cartesianAxisOptionsDefs,
    cartesianTimeAxisLabel,
    cartesianTimeAxisParentLevel,
    discreteTimeAxisIntervalOptionsDefs,
    timeInterval,
    timeIntervalUnit,
} from '../../chart/axesOptionsDefs';
import { UnitTimeAxis } from '../../chart/axis/unitTimeAxis';

export const UnitTimeAxisModule: AxisModuleDefinition<AgUnitTimeAxisOptions> = {
    type: 'axis',
    name: 'unit-time',
    chartType: 'cartesian',

    options: {
        ...cartesianAxisOptionsDefs,
        type: required(constant('unit-time')),
        unit: or(timeInterval, timeIntervalUnit),
        label: cartesianTimeAxisLabel,
        parentLevel: cartesianTimeAxisParentLevel,
        paddingInner: ratio,
        paddingOuter: ratio,
        groupPaddingInner: ratio,
        crosshair: cartesianAxisCrosshairOptions(true, true),
        bandHighlight: cartesianAxisBandHighlightOptions,
        min: and(or(number, date), lessThan('max')),
        max: and(or(number, date), greaterThan('min')),
        interval: discreteTimeAxisIntervalOptionsDefs,
    },

    create: (ctx) => new UnitTimeAxis(ctx),
};
