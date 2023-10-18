import type { _ModuleSupport } from 'ag-charts-community';

import { ANGLE_AXIS_THEME } from '../angle/angleAxisThemes';
import { AngleCategoryAxis } from './angleCategoryAxis';

export const AngleCategoryAxisModule: _ModuleSupport.AxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',

    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'angle-category',
    instanceConstructor: AngleCategoryAxis,
    themeTemplate: ANGLE_AXIS_THEME,
};
