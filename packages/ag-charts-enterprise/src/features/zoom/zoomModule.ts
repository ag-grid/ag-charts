import type { AgZoomOptions, _ModuleSupport } from 'ag-charts-community';

import { Zoom } from './zoom';

const buttons: AgZoomOptions['buttons'] = {
    enabled: true,
    visible: 'hover',
    buttons: [
        {
            icon: 'zoom-out',
            tooltip: 'toolbarZoomZoomOut',
            value: 'zoom-out',
            section: 'scale',
        },
        {
            icon: 'zoom-in',
            tooltip: 'toolbarZoomZoomIn',
            value: 'zoom-in',
            section: 'scale',
        },
        {
            icon: 'pan-left',
            tooltip: 'toolbarZoomPanLeft',
            value: 'pan-left',
            section: 'pan',
        },
        {
            icon: 'pan-right',
            tooltip: 'toolbarZoomPanRight',
            value: 'pan-right',
            section: 'pan',
        },
        {
            icon: 'reset',
            tooltip: 'toolbarZoomReset',
            value: 'reset',
            section: 'reset',
        },
    ],
};

export const ZoomModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'zoom',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'topology'],
    moduleFactory: (ctx) => new Zoom(ctx),
    themeTemplate: {
        zoom: {
            anchorPointX: 'end',
            anchorPointY: 'middle',
            axes: 'x',
            buttons,
            enabled: false,
            enableAxisDragging: true,
            enableDoubleClickToReset: true,
            enablePanning: true,
            enableScrolling: true,
            enableSelecting: false,
            enableTwoFingerZoom: true,
            deceleration: 'short',
            minVisibleItems: 2,
            panKey: 'alt',
            scrollingStep: 0.1,
            autoScaling: {
                enabled: false,
                padding: 0.05,
            },
        },
    },
};
