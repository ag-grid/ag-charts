import type { AgChartContextMenuEvent, _ModuleSupport, _Scene } from 'ag-charts-community';

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

const CONTEXT_ZOOM_ACTION_ID = 'zoom-action';
const CONTEXT_PAN_ACTION_ID = 'pan-action';

export class ZoomContextMenu {
    constructor(
        private readonly contextMenuRegistry: _ModuleSupport.ContextMenuRegistry,
        private readonly zoomManager: _ModuleSupport.ZoomManager,
        private readonly getModuleProperties: () => ZoomProperties,
        private readonly getRect: () => _Scene.BBox | undefined,
        private readonly updateZoom: (zoom: DefinedZoomState) => void
    ) {}

    public registerActions(enabled: boolean | undefined, zoom: DefinedZoomState) {
        if (!enabled) return;

        const { contextMenuRegistry } = this;

        const destroyZoomToCursor = contextMenuRegistry.registerDefaultAction({
            id: CONTEXT_ZOOM_ACTION_ID,
            type: 'series',
            label: 'contextMenuZoomToCursor',
            action: this.onZoomToHere.bind(this),
        });
        const destroyPanToCursor = contextMenuRegistry.registerDefaultAction({
            id: CONTEXT_PAN_ACTION_ID,
            type: 'series',
            label: 'contextMenuPanToCursor',
            action: this.onPanToHere.bind(this),
        });

        this.toggleActions(zoom);

        return () => {
            destroyZoomToCursor();
            destroyPanToCursor();
        };
    }

    public toggleActions(zoom: DefinedZoomState) {
        const { contextMenuRegistry } = this;
        const { minRatioX, minRatioY } = this.getModuleProperties();

        if (isZoomLess(zoom, minRatioX, minRatioY)) {
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

    private onZoomToHere({ event }: AgChartContextMenuEvent) {
        const rect = this.getRect();
        const { enabled, isScalingX, isScalingY, minRatioX, minRatioY } = this.getModuleProperties();

        if (!enabled || !rect || !event || !event.target || !(event instanceof MouseEvent)) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());
        const origin = pointToRatio(rect, event.offsetX, event.offsetX);

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

    private onPanToHere({ event }: AgChartContextMenuEvent) {
        const rect = this.getRect();
        const { enabled } = this.getModuleProperties();

        if (!enabled || !rect || !event || !event.target || !(event instanceof MouseEvent)) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());
        const origin = pointToRatio(rect, event.offsetX, event.offsetY);

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
