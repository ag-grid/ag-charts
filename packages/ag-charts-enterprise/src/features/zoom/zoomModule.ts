import type { _ModuleSupport } from 'ag-charts-community';

import { Zoom } from './zoom';

export const ZoomModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'zoom',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: Zoom,
    themeTemplate: {
        zoom: {
            anchorPointX: 'end',
            anchorPointY: 'middle',
            axes: 'x',
            enabled: false,
            enableAxisDragging: true,
            enableDoubleClickToReset: true,
            enablePanning: true,
            enableScrolling: true,
            enableSelecting: false,
            minVisibleItemsX: 2,
            minVisibleItemsY: 2,
            panKey: 'alt',
            scrollingStep: 0.1,
        },
    },
};
