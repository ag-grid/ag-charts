import type { _ModuleSupport } from 'ag-charts-community';

import { Zoom } from './zoom';

export const ZoomModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'zoom',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: Zoom,
    themeTemplate: {
        zoom: { enabled: false },
    },
};
