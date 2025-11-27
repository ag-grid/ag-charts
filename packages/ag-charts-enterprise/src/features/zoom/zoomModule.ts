import { VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    type PluginModuleDefinition,
    arrayOfDefs,
    boolean,
    or,
    positiveNumber,
    ratio,
    strictUnion,
    string,
    undocumented,
    union,
} from 'ag-charts-core';
import type { AgZoomButton, AgZoomOnDataChangeStrategy, AgZoomOptions } from 'ag-charts-types';

import { Zoom } from './zoom';

const zoomAnchorPoint = union('pointer', 'start', 'middle', 'end');

export const ZoomModule: PluginModuleDefinition<AgZoomOptions> = {
    type: 'plugin',
    name: 'zoom',
    enterprise: true,
    version: VERSION,

    options: {
        enabled: boolean,
        enableAxisDragging: boolean,
        enableAxisScrolling: boolean,
        enableDoubleClickToReset: boolean,
        enablePanning: boolean,
        enableScrolling: boolean,
        enableSelecting: boolean,
        enableTwoFingerZoom: boolean,
        keepAspectRatio: boolean,
        anchorPointX: zoomAnchorPoint,
        anchorPointY: zoomAnchorPoint,
        axisDraggingMode: union('pan', 'zoom'),
        axes: union('x', 'y', 'xy'),
        deceleration: or(union('off', 'short', 'long'), ratio),
        minVisibleItems: positiveNumber,
        panKey: union('alt', 'ctrl', 'meta', 'shift'),
        scrollingStep: ratio,
        autoScaling: {
            enabled: boolean,
            padding: ratio,
        },
        onDataChange: {
            strategy: strictUnion<AgZoomOnDataChangeStrategy>()(
                'reset',
                'preserveDomain',
                'preserveRatios',
                'preserveData'
            ),
        },
        buttons: {
            enabled: boolean,
            buttons: arrayOfDefs<AgZoomButton>(
                {
                    ..._ModuleSupport.toolbarButtonOptionsDefs,
                    value: union('reset', 'zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-start', 'pan-end'),
                    section: string,
                },
                'zoom button options array'
            ),
            visible: union('always', 'zoomed', 'hover'),
        },
    },
    themeTemplate: {
        enabled: false,
        enableAxisDragging: true,
        enableAxisScrolling: true,
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
            enabled: {
                $and: [
                    { $eq: [{ $path: '../axes' }, 'x'] },
                    { $not: { $eq: [{ $path: '/series/0/direction' }, 'horizontal'] } },
                ],
            },
            padding: 0.05,
        },
        onDataChange: {
            strategy: 'preserveDomain',
        },
        anchorPointX: 'end',
        anchorPointY: 'middle',
        axes: 'x',
        buttons: {
            enabled: { $path: '../enabled' },
            visible: 'hover',
            buttons: [
                { icon: 'zoom-out', value: 'zoom-out', section: 'scale' },
                { icon: 'zoom-in', value: 'zoom-in', section: 'scale' },
                { icon: 'pan-left', value: 'pan-left', section: 'pan' },
                { icon: 'pan-right', value: 'pan-right', section: 'pan' },
                { icon: 'reset', value: 'reset', section: 'reset' },
            ],
        },
    },

    create: (ctx) => new Zoom(ctx),
};

// @ts-expect-error undocumented option
ZoomModule.options.enableIndependentAxes = undocumented(boolean);
// @ts-expect-error undocumented option
ZoomModule.options.buttons.anchorPointX = undocumented(zoomAnchorPoint);
// @ts-expect-error undocumented option
ZoomModule.options.buttons.anchorPointY = undocumented(zoomAnchorPoint);
