import type { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { RadiusCategoryAxis } from './radiusCategoryAxis';
import { RADIUS_AXIS_THEME } from '../radius/radiusAxisThemes';

export const RadiusCategoryAxisModule: _ModuleSupport.AxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',

    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radius-category',
    instanceConstructor: RadiusCategoryAxis,
    themeTemplate: RADIUS_AXIS_THEME,
};
