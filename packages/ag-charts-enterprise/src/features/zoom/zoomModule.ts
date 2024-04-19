import type { _ModuleSupport } from 'ag-charts-community';

import { Zoom } from './zoom';

export const ZoomModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'zoom',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'topology'],
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
                        icon: 'desc',
                        tooltip: 'Zoom out',
                        value: 'zoom-out',
                    },
                    {
                        icon: 'asc',
                        tooltip: 'Zoom in',
                        value: 'zoom-in',
                    },
                    {
                        icon: 'left',
                        tooltip: 'Pan left',
                        value: 'pan-left',
                    },
                    {
                        icon: 'right',
                        tooltip: 'Pan right',
                        value: 'pan-right',
                    },
                    {
                        icon: 'arrows',
                        tooltip: 'Reset the zoom',
                        value: 'reset-zoom',
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
