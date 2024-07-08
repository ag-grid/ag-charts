import { _ModuleSupport } from 'ag-charts-community';

import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
import {
    DEFAULT_ANCHOR_POINT_X,
    DEFAULT_ANCHOR_POINT_Y,
    UNIT,
    constrainAxis,
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

const { ChartAxisDirection, ToolbarManager } = _ModuleSupport;

export class ZoomToolbar {
    constructor(
        private readonly toolbarManager: _ModuleSupport.ToolbarManager,
        private readonly zoomManager: _ModuleSupport.ZoomManager,
        private readonly getResetZoom: () => DefinedZoomState,
        private readonly updateZoom: (zoom: DefinedZoomState) => void,
        private readonly updateAxisZoom: (
            axisId: string,
            direction: _ModuleSupport.ChartAxisDirection,
            partialZoom: _ModuleSupport.ZoomState | undefined
        ) => void
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

        toolbarManager.toggleButton('zoom', 'pan-start', { enabled: zoom.x.min > UNIT.min });
        toolbarManager.toggleButton('zoom', 'pan-end', { enabled: zoom.x.max < UNIT.max });
        toolbarManager.toggleButton('zoom', 'pan-left', { enabled: zoom.x.min > UNIT.min });
        toolbarManager.toggleButton('zoom', 'pan-right', { enabled: zoom.x.max < UNIT.max });
        toolbarManager.toggleButton('zoom', 'zoom-out', { enabled: !isMaxZoom });
        toolbarManager.toggleButton('zoom', 'zoom-in', { enabled: !isMinZoom });
        toolbarManager.toggleButton('zoom', 'reset', { enabled: !isResetZoom });
    }

    public onButtonPress(event: _ModuleSupport.ToolbarButtonPressedEvent, props: ZoomProperties) {
        this.onButtonPressRanges(event, props);
        this.onButtonPressZoom(event, props);
    }

    private toggleGroups(enabled?: boolean) {
        this.toolbarManager?.toggleGroup('zoom', 'ranges', Boolean(enabled));
        this.toolbarManager?.toggleGroup('zoom', 'zoom', Boolean(enabled));
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

        if (props.independentAxes && event.value !== 'reset') {
            const axisZooms = this.zoomManager.getAxisZooms();
            for (const [axisId, { direction, zoom }] of Object.entries(axisZooms)) {
                if (zoom == null) continue;
                this.onButtonPressZoomAxis(event, props, axisId, direction, zoom);
            }
        } else {
            this.onButtonPressZoomUnified(event, props);
        }
    }

    private onButtonPressZoomAxis(
        event: _ModuleSupport.ToolbarButtonPressedEvent,
        props: ZoomProperties,
        axisId: string,
        direction: _ModuleSupport.ChartAxisDirection,
        zoom: _ModuleSupport.ZoomState
    ) {
        if (!ToolbarManager.isGroup('zoom', event)) return;

        const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;

        let newZoom = { ...zoom };
        const delta = zoom.max - zoom.min;

        switch (event.value) {
            case 'pan-start':
                newZoom.max = delta;
                newZoom.min = 0;
                break;

            case 'pan-end':
                newZoom.min = newZoom.max - delta;
                newZoom.max = UNIT.max;
                break;

            case 'pan-left':
                newZoom.min -= delta * scrollingStep;
                newZoom.max -= delta * scrollingStep;
                break;

            case 'pan-right':
                newZoom.min += delta * scrollingStep;
                newZoom.max += delta * scrollingStep;
                break;

            case 'zoom-in':
            case 'zoom-out': {
                const isDirectionX = direction === ChartAxisDirection.X;
                const isScalingDirection = (isDirectionX && isScalingX) || (!isDirectionX && isScalingY);

                let scale = event.value === 'zoom-in' ? 1 - scrollingStep : 1 + scrollingStep;
                if (!isScalingDirection) scale = 1;

                const useAnchorPointX = anchorPointX === 'pointer' ? DEFAULT_ANCHOR_POINT_X : anchorPointX;
                const useAnchorPointY = anchorPointY === 'pointer' ? DEFAULT_ANCHOR_POINT_Y : anchorPointY;
                const useAnchorPoint = isDirectionX ? useAnchorPointX : useAnchorPointY;

                newZoom.max = newZoom.min + (newZoom.max - newZoom.min) * scale;
                newZoom = scaleZoomAxisWithAnchor(newZoom, zoom, useAnchorPoint);
                break;
            }
        }

        this.updateAxisZoom(axisId, direction, constrainAxis(newZoom));
    }

    private onButtonPressZoomUnified(event: _ModuleSupport.ToolbarButtonPressedEvent, props: ZoomProperties) {
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
                zoom = translateZoom(zoom, -dx(zoom) * scrollingStep, 0);
                break;

            case 'pan-right':
                zoom = translateZoom(zoom, dx(zoom) * scrollingStep, 0);
                break;

            case 'zoom-in':
            case 'zoom-out': {
                const scale = event.value === 'zoom-in' ? 1 - scrollingStep : 1 + scrollingStep;
                const useAnchorPointX = anchorPointX === 'pointer' ? DEFAULT_ANCHOR_POINT_X : anchorPointX;
                const useAnchorPointY = anchorPointY === 'pointer' ? DEFAULT_ANCHOR_POINT_Y : anchorPointY;

                zoom = scaleZoom(zoom, isScalingX ? scale : 1, isScalingY ? scale : 1);
                zoom.x = scaleZoomAxisWithAnchor(zoom.x, oldZoom.x, useAnchorPointX);
                zoom.y = scaleZoomAxisWithAnchor(zoom.y, oldZoom.y, useAnchorPointY);
                break;
            }
        }

        this.updateZoom(constrainZoom(zoom));
    }
}
