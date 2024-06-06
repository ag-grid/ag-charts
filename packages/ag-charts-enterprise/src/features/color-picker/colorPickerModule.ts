import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

import { ColorPicker } from './colorPicker';

export const ColorPickerModule: _ModuleSupport.Module = {
    type: 'root',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy', 'topology', 'flow-proportion'],
    optionsKey: 'colorPicker',
    instanceConstructor: ColorPicker,
    themeTemplate: {
        colorPicker: {
            enabled: true,
            // darkTheme: _Theme.IS_DARK_THEME,
        },
    },
};
