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
import { CartesianChartModule } from '../../chart/cartesianChartModule';
import { VERSION } from '../../version';

export const TimeAxisModule: AxisModuleDefinition<AgTimeAxisOptions> = {
    type: 'axis',
    name: 'time',
    chartType: 'cartesian',
    version: VERSION,
    dependencies: [CartesianChartModule],

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
