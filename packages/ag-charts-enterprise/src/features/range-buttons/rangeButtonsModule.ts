import type { _ModuleSupport } from 'ag-charts-community';

import { RangeButtons } from './rangeButtons';

export const RangeButtonsModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'rangeButtons',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: RangeButtons,
    themeTemplate: {
        rangeButtons: { enabled: false },
    },
};
