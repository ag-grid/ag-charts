import type { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';

import { RADIUS_AXIS_THEME } from '../radius/radiusAxisThemes';
import { RadiusCategoryAxis } from './radiusCategoryAxis';

export const RadiusCategoryAxisModule: _ModuleSupport.AxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',

    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radius-category',
    instanceConstructor: RadiusCategoryAxis,
    themeTemplate: RADIUS_AXIS_THEME,
};
