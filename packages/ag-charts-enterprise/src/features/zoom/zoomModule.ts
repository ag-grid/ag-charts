import type { _ModuleSupport } from 'ag-charts-community';

import { Zoom } from './zoom';

export const ZoomModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'zoom',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'topology'],
    dependencies: ['toolbar'],
    instanceConstructor: Zoom,
    themeTemplate: {
        zoom: {
            anchorPointX: 'end',
            anchorPointY: 'middle',
            axes: 'x',
            buttons: {
                enabled: true,
                buttons: [
                    {
                        icon: 'zoom-out',
                        tooltip: 'toolbarZoomZoomOut',
                        value: 'zoom-out',
                    },
                    {
                        icon: 'zoom-in',
                        tooltip: 'toolbarZoomZoomIn',
                        value: 'zoom-in',
                    },
                    {
                        icon: 'pan-left',
                        tooltip: 'toolbarZoomPanLeft',
                        value: 'pan-left',
                    },
                    {
                        icon: 'pan-right',
                        tooltip: 'toolbarZoomPanRight',
                        value: 'pan-right',
                    },
                    {
                        icon: 'reset',
                        tooltip: 'toolbarZoomReset',
                        value: 'reset',
                    },
                ],
            },
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
