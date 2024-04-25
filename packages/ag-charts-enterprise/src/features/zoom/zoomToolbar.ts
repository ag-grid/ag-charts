import { _ModuleSupport } from 'ag-charts-community';

import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
import {
    DEFAULT_ANCHOR_POINT_X,
    DEFAULT_ANCHOR_POINT_Y,
    UNIT,
    constrainZoom,
    definedZoomState,
    dx,
    isZoomEqual,
    isZoomLess,
    scaleZoom,
    scaleZoomAxisWithAnchor,
    translateZoom,
    unitZoomState,
} from './zoomUtils';

const { ToolbarManager } = _ModuleSupport;

export class ZoomToolbar {
    constructor(
        private readonly toolbarManager: _ModuleSupport.ToolbarManager,
        private readonly zoomManager: _ModuleSupport.ZoomManager,
        private readonly getResetZoom: () => DefinedZoomState,
        private readonly updateZoom: (zoom: DefinedZoomState) => void
    ) {}

    public toggle(enabled: boolean | undefined, zoom: DefinedZoomState, props: ZoomProperties) {
        this.toggleGroups(enabled);
        if (enabled) {
            this.toggleButtons(zoom, props);
        }
    }

    public toggleButtons(zoom: DefinedZoomState, props: ZoomProperties) {
        const { toolbarManager } = this;

        const isMaxZoom = isZoomEqual(zoom, unitZoomState());
        const isMinZoom = isZoomLess(zoom, props.minRatioX, props.minRatioY);
        const isResetZoom = isZoomEqual(zoom, this.getResetZoom());

        toolbarManager.toggleButton('zoom', 'pan-start', zoom.x.min > UNIT.min);
        toolbarManager.toggleButton('zoom', 'pan-end', zoom.x.max < UNIT.max);
        toolbarManager.toggleButton('zoom', 'pan-left', zoom.x.min > UNIT.min);
        toolbarManager.toggleButton('zoom', 'pan-right', zoom.x.max < UNIT.max);
        toolbarManager.toggleButton('zoom', 'zoom-out', !isMaxZoom);
        toolbarManager.toggleButton('zoom', 'zoom-in', !isMinZoom);
        toolbarManager.toggleButton('zoom', 'reset', !isResetZoom);
    }

    public onButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent, props: ZoomProperties) {
        this.onButtonPressRanges(event, props);
        this.onButtonPressZoom(event, props);
    }

    private toggleGroups(enabled?: boolean) {
        this.toolbarManager?.toggleGroup('ranges', Boolean(enabled));
        this.toolbarManager?.toggleGroup('zoom', Boolean(enabled));
    }

    private onButtonPressRanges(event: _ModuleSupport.ToolbarButtonPressedEvent, props: ZoomProperties) {
        if (!ToolbarManager.isGroup('ranges', event)) return;

        const { rangeX } = props;

        const time = event.value;
        if (typeof time === 'number') {
            rangeX.extendToEnd(time);
        } else if (Array.isArray(time)) {
            rangeX.updateWith(() => time);
        } else if (typeof time === 'function') {
            rangeX.updateWith(time);
        }
    }

    private onButtonPressZoom(event: _ModuleSupport.ToolbarButtonPressedEvent, props: ZoomProperties) {
        if (!ToolbarManager.isGroup('zoom', event)) return;

        const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;

        const oldZoom = definedZoomState(this.zoomManager.getZoom());
        let zoom = definedZoomState(oldZoom);

        switch (event.value) {
            case 'reset':
                zoom = this.getResetZoom();
                break;

            case 'pan-start':
                zoom.x.max = dx(zoom);
                zoom.x.min = 0;
                break;

            case 'pan-end':
                zoom.x.min = UNIT.max - dx(zoom);
                zoom.x.max = UNIT.max;
                break;

            case 'pan-left':
            case 'pan-right':
                zoom = translateZoom(zoom, event.value === 'pan-left' ? -dx(zoom) : dx(zoom), 0);
                break;

            case 'zoom-in':
            case 'zoom-out':
                const scale = event.value === 'zoom-in' ? 1 - scrollingStep : 1 + scrollingStep;

                const useAnchorPointX = anchorPointX === 'pointer' ? DEFAULT_ANCHOR_POINT_X : anchorPointX;
                const useAnchorPointY = anchorPointY === 'pointer' ? DEFAULT_ANCHOR_POINT_Y : anchorPointY;

                zoom = scaleZoom(zoom, isScalingX ? scale : 1, isScalingY ? scale : 1);
                zoom.x = scaleZoomAxisWithAnchor(zoom.x, oldZoom.x, useAnchorPointX);
                zoom.y = scaleZoomAxisWithAnchor(zoom.y, oldZoom.y, useAnchorPointY);
                break;
        }

        this.updateZoom(constrainZoom(zoom));
    }
}
