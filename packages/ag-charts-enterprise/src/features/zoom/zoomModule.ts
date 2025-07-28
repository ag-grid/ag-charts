import type { AgZoomOptions, _ModuleSupport } from 'ag-charts-community';

import { Zoom } from './zoom';

const buttons: AgZoomOptions['buttons'] = {
    enabled: true,
    visible: 'hover',
    buttons: [
        {
            icon: 'zoom-out',
            value: 'zoom-out',
            section: 'scale',
        },
        {
            icon: 'zoom-in',
            value: 'zoom-in',
            section: 'scale',
        },
        {
            icon: 'pan-left',
            value: 'pan-left',
            section: 'pan',
        },
        {
            icon: 'pan-right',
            value: 'pan-right',
            section: 'pan',
        },
        {
            icon: 'reset',
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
                enabled: { $eq: [{ $path: '../axes' }, 'x'] },
                padding: 0.05,
            },
        },
    },
};
