import type { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
import {
    UNIT,
    constrainZoom,
    definedZoomState,
    dx,
    dy,
    isZoomEqual,
    isZoomLess,
    pointToRatio,
    scaleZoomCenter,
    translateZoom,
    unitZoomState,
} from './zoomUtils';

type ContextMenuActionParams = _ModuleSupport.ContextMenuActionParams;

const CONTEXT_ZOOM_ACTION_ID = 'zoom-action';
const CONTEXT_PAN_ACTION_ID = 'pan-action';

export class ZoomContextMenu {
    public rect?: _Scene.BBox;

    constructor(
        private readonly contextMenuRegistry: _ModuleSupport.ContextMenuRegistry,
        private readonly zoomManager: _ModuleSupport.ZoomManager,
        private readonly updateZoom: (zoom: DefinedZoomState) => void
    ) {}

    public registerActions(enabled: boolean | undefined, zoom: DefinedZoomState, props: ZoomProperties) {
        if (!enabled) return;

        const { contextMenuRegistry } = this;

        contextMenuRegistry.registerDefaultAction({
            id: CONTEXT_ZOOM_ACTION_ID,
            type: 'series',
            label: 'Zoom to here',
            action: (params) => this.onZoomToHere(params, props),
        });
        contextMenuRegistry.registerDefaultAction({
            id: CONTEXT_PAN_ACTION_ID,
            type: 'series',
            label: 'Pan to here',
            action: (params) => this.onPanToHere(params, props),
        });

        this.toggleActions(zoom, props);
    }

    public toggleActions(zoom: DefinedZoomState, props: ZoomProperties) {
        const { contextMenuRegistry } = this;

        if (isZoomLess(zoom, props.minRatioX, props.minRatioY)) {
            contextMenuRegistry.disableAction(CONTEXT_ZOOM_ACTION_ID);
        } else {
            contextMenuRegistry.enableAction(CONTEXT_ZOOM_ACTION_ID);
        }

        if (isZoomEqual(zoom, unitZoomState())) {
            contextMenuRegistry.disableAction(CONTEXT_PAN_ACTION_ID);
        } else {
            contextMenuRegistry.enableAction(CONTEXT_PAN_ACTION_ID);
        }
    }

    private onZoomToHere({ event }: ContextMenuActionParams, props: ZoomProperties) {
        const { rect } = this;
        const { enabled, isScalingX, isScalingY, minRatioX, minRatioY } = props;

        if (!enabled || !rect || !event || !event.target) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());
        const origin = pointToRatio(rect, event.clientX, event.clientY);

        const scaledOriginX = origin.x * dx(zoom);
        const scaledOriginY = origin.y * dy(zoom);

        const size = UNIT.max - UNIT.min;
        const halfSize = size / 2;

        let newZoom = {
            x: { min: origin.x - halfSize, max: origin.x + halfSize },
            y: { min: origin.y - halfSize, max: origin.y + halfSize },
        };

        newZoom = scaleZoomCenter(newZoom, isScalingX ? minRatioX : size, isScalingY ? minRatioY : size);
        newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);

        this.updateZoom(constrainZoom(newZoom));
    }

    private onPanToHere({ event }: ContextMenuActionParams, props: ZoomProperties) {
        const { rect } = this;
        const { enabled } = props;

        if (!enabled || !rect || !event || !event.target) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());
        const origin = pointToRatio(rect, event.clientX, event.clientY);

        const scaleX = dx(zoom);
        const scaleY = dy(zoom);

        const scaledOriginX = origin.x * scaleX;
        const scaledOriginY = origin.y * scaleY;

        const halfSize = (UNIT.max - UNIT.min) / 2;

        let newZoom = {
            x: { min: origin.x - halfSize, max: origin.x + halfSize },
            y: { min: origin.y - halfSize, max: origin.y + halfSize },
        };

        newZoom = scaleZoomCenter(newZoom, scaleX, scaleY);
        newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);

        this.updateZoom(constrainZoom(newZoom));
    }
}
