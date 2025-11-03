import {
    type AxisModuleDefinition,
    and,
    attachDescription,
    constant,
    number,
    positiveNumberNonZero,
    required,
} from 'ag-charts-core';
import type { AgLogAxisOptions } from 'ag-charts-types';

import {
    cartesianAxisCrosshairOptions,
    cartesianAxisOptionsDefs,
    cartesianNumericAxisLabel,
    continuousAxisOptions,
} from '../../chart/axesOptionsDefs';
import { LogAxis } from '../../chart/axis/logAxis';
import { VERSION } from '../../version';

export const LogAxisModule: AxisModuleDefinition<AgLogAxisOptions> = {
    type: 'axis',
    name: 'log',
    chartType: 'cartesian',
    version: VERSION,

    options: {
        ...cartesianAxisOptionsDefs,
        ...continuousAxisOptions(number),
        type: required(constant('log')),
        base: and(
            positiveNumberNonZero,
            attachDescription((value) => value !== 1, 'not equal to 1')
        ),
        label: cartesianNumericAxisLabel,
        crosshair: cartesianAxisCrosshairOptions(true),
    },

    create: (ctx) => new LogAxis(ctx),
};
