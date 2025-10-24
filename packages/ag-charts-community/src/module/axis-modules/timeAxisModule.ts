import { type AxisModuleDefinition, constant, date, number, or, required } from 'ag-charts-core';
import type { AgTimeAxisOptions } from 'ag-charts-types';

import {
    cartesianAxisCrosshairOptions,
    cartesianAxisOptionsDefs,
    cartesianTimeAxisLabel,
    cartesianTimeAxisParentLevel,
    continuousAxisOptions,
} from '../../chart/axesOptionsDefs';
import { TimeAxis } from '../../chart/axis/timeAxis';

export const TimeAxisModule: AxisModuleDefinition<AgTimeAxisOptions> = {
    type: 'axis',
    name: 'time',
    chartType: 'cartesian',

    options: {
        ...cartesianAxisOptionsDefs,
        ...continuousAxisOptions(or(number, date), true),
        type: required(constant('time')),
        label: cartesianTimeAxisLabel,
        parentLevel: cartesianTimeAxisParentLevel,
        crosshair: cartesianAxisCrosshairOptions(true, true),
    },

    create: (ctx) => new TimeAxis(ctx),
};
