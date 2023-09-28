import type { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { RADIUS_AXIS_THEME } from '../radius/radiusAxisThemes';
import { RadiusNumberAxis } from './radiusNumberAxis';

export const RadiusNumberAxisModule: _ModuleSupport.AxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',

    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radius-number',
    instanceConstructor: RadiusNumberAxis,
    themeTemplate: RADIUS_AXIS_THEME,
};
