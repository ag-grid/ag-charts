import type { AgSeriesAreaContextMenuActionEvent, _ModuleSupport } from 'ag-charts-community';

import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
import {
    UNIT_SIZE,
    constrainZoom,
    definedZoomState,
    dx,
    dy,
    isZoomEqual,
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
        private readonly getRect: () => _ModuleSupport.BBox | undefined,
        private readonly updateZoom: (zoom: DefinedZoomState) => void,
        private readonly isZoomValid: (zoom: DefinedZoomState) => boolean
    ) {}

    public registerActions(enabled: boolean | undefined) {
        if (!enabled) return;

        const { contextMenuRegistry } = this;

        const destroyZoomToCursor = contextMenuRegistry.registerDefaultAction({
            id: CONTEXT_ZOOM_ACTION_ID,
            type: 'series-area',
            label: 'contextMenuZoomToCursor',
            action: this.onZoomToHere.bind(this),
            toggleEnabledOnShow: (event) => {
                const rect = this.getRect();
                if (!rect) return true;
                const origin = pointToRatio(rect, event.x, event.y);
                return this.iterateFindNextZoomAtPoint(origin) != null;
            },
        });
        const destroyPanToCursor = contextMenuRegistry.registerDefaultAction({
            id: CONTEXT_PAN_ACTION_ID,
            type: 'series-area',
            label: 'contextMenuPanToCursor',
            action: this.onPanToHere.bind(this),
            toggleEnabledOnShow: () => !isZoomEqual(definedZoomState(this.zoomManager.getZoom()), unitZoomState()),
        });

        return () => {
            destroyZoomToCursor();
            destroyPanToCursor();
        };
    }

    private computeOrigin(event: Event): { x: number; y: number } | undefined {
        const rect = this.getRect();
        const { enabled } = this.getModuleProperties();

        if (!enabled || !rect || !event?.target || !(event instanceof MouseEvent)) return;

        const relativeRect = { x: 0, y: 0, width: rect.width, height: rect.height };
        return pointToRatio(relativeRect, event.offsetX, event.offsetY);
    }

    private onZoomToHere({ event }: AgSeriesAreaContextMenuActionEvent) {
        const origin = this.computeOrigin(event);
        if (!origin) return;

        const zoom = this.iterateFindNextZoomAtPoint(origin);
        if (zoom == null) return;

        this.updateZoom(zoom);
    }

    private onPanToHere({ event }: AgSeriesAreaContextMenuActionEvent) {
        const origin = this.computeOrigin(event);
        if (!origin) return;

        const zoom = definedZoomState(this.zoomManager.getZoom());

        const scaleX = dx(zoom);
        const scaleY = dy(zoom);

        const scaledOriginX = origin.x * scaleX;
        const scaledOriginY = origin.y * scaleY;

        const halfSize = UNIT_SIZE / 2;

        let newZoom = {
            x: { min: origin.x - halfSize, max: origin.x + halfSize },
            y: { min: origin.y - halfSize, max: origin.y + halfSize },
        };

        newZoom = scaleZoomCenter(newZoom, scaleX, scaleY);
        newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);

        this.updateZoom(constrainZoom(newZoom));
    }

    private iterateFindNextZoomAtPoint(origin: _ModuleSupport.Vec2) {
        const { scrollingStep } = this.getModuleProperties();

        for (let i = scrollingStep; i <= 1 - scrollingStep; i += scrollingStep) {
            const zoom = this.getNextZoomAtPoint(origin, i);
            if (this.isZoomValid(zoom)) {
                return zoom;
            }
        }
    }

    private getNextZoomAtPoint(origin: _ModuleSupport.Vec2, step: number) {
        const { isScalingX, isScalingY } = this.getModuleProperties();

        const zoom = definedZoomState(this.zoomManager.getZoom());

        const scaledOriginX = origin.x * dx(zoom);
        const scaledOriginY = origin.y * dy(zoom);

        const halfSize = UNIT_SIZE / 2;

        let newZoom = {
            x: { min: origin.x - halfSize, max: origin.x + halfSize },
            y: { min: origin.y - halfSize, max: origin.y + halfSize },
        };

        newZoom = scaleZoomCenter(
            newZoom,
            isScalingX ? dx(zoom) * step : UNIT_SIZE,
            isScalingY ? dy(zoom) * step : UNIT_SIZE
        );
        newZoom = translateZoom(newZoom, zoom.x.min - origin.x + scaledOriginX, zoom.y.min - origin.y + scaledOriginY);

        return constrainZoom(newZoom);
    }
}
