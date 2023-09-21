import type { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { AngleNumberAxis } from './angleNumberAxis';
import { ANGLE_NUMBER_AXIS_THEME } from './angleNumberAxisThemes';

export const AngleNumberAxisModule: _ModuleSupport.AxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',

    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'angle-number',
    instanceConstructor: AngleNumberAxis,
    themeTemplate: ANGLE_NUMBER_AXIS_THEME,
};
