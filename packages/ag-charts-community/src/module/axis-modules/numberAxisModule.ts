import { type AxisModuleDefinition, constant, number, required } from 'ag-charts-core';
import type { AgNumberAxisOptions } from 'ag-charts-types';

import {
    cartesianAxisCrosshairOptions,
    cartesianAxisOptionsDefs,
    cartesianNumericAxisLabel,
    continuousAxisOptions,
} from '../../chart/axesOptionsDefs';
import { NumberAxis } from '../../chart/axis/numberAxis';

export const NumberAxisModule: AxisModuleDefinition<AgNumberAxisOptions> = {
    type: 'axis',
    name: 'number',
    chartType: 'cartesian',

    options: {
        ...cartesianAxisOptionsDefs,
        ...continuousAxisOptions(number),
        type: required(constant('number')),
        label: cartesianNumericAxisLabel,
        crosshair: cartesianAxisCrosshairOptions(true),
    },

    create: (ctx) => new NumberAxis(ctx),
};
