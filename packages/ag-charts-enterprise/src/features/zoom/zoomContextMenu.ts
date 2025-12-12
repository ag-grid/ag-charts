import { _ModuleSupport } from 'ag-charts-community';
import type { AgSeriesAreaContextMenuActionEvent } from 'ag-charts-community';
import type { BoxBounds, DefinedViewportState, Point } from 'ag-charts-core';
import { definedZoomState } from 'ag-charts-core';

import type { ZoomProperties } from './zoomTypes';
import {
    UNIT_SIZE,
    canResetZoom,
    constrainZoom,
    dx,
    dy,
    isZoomEqual,
    pointToRatio,
    scaleZoomCenter,
    translateZoom,
    unitZoomState,
} from './zoomUtils';

const { userInteraction } = _ModuleSupport;

export class ZoomContextMenu {
    constructor(
        private readonly eventsHub: _ModuleSupport.EventsHub,
        private readonly contextMenuRegistry: _ModuleSupport.ContextMenuRegistry,
        private readonly zoomManager: _ModuleSupport.ZoomManager,
        private readonly getModuleProperties: () => ZoomProperties,
        private readonly getRect: () => BoxBounds | undefined,
        private readonly updateZoom: (sourcing: _ModuleSupport.UpdateZoomSourcing, zoom: DefinedViewportState) => void,
        private readonly isZoomValid: (zoom: DefinedViewportState) => boolean
    ) {}

    public registerActions(enabled: boolean | undefined) {
        const { contextMenuRegistry } = this;

        const action = enabled ? 'show' : 'hide';
        contextMenuRegistry.toggle('zoom-to-cursor', action);
        contextMenuRegistry.toggle('pan-to-cursor', action);
        contextMenuRegistry.toggle('reset-zoom', action);

        if (!enabled) {
            return;
        }

        contextMenuRegistry.builtins.items['zoom-to-cursor'].action = this.onZoomToHere.bind(this);
        contextMenuRegistry.builtins.items['pan-to-cursor'].action = this.onPanToHere.bind(this);
        contextMenuRegistry.builtins.items['reset-zoom'].action = this.onResetZoom.bind(this);

        const shouldEnableZoomToHere = (event: _ModuleSupport.ContextMenuEvent) => {
            const rect = this.getRect();
            if (!rect) return true;
            const origin = pointToRatio(rect, event.x, event.y);
            return this.iterateFindNextZoomAtPoint(origin) != null;
        };
        const shouldEnablePanToHere = () => {
            return !isZoomEqual(definedZoomState(this.zoomManager.getZoom()), unitZoomState());
        };
        const removeListener = this.eventsHub.on('context-menu:setup', (event) => {
            contextMenuRegistry.builtins.items['zoom-to-cursor'].enabled = shouldEnableZoomToHere(event);
            contextMenuRegistry.builtins.items['pan-to-cursor'].enabled = shouldEnablePanToHere();
            contextMenuRegistry.builtins.items['reset-zoom'].enabled = canResetZoom(this.zoomManager);
        });

        return () => {
            removeListener();
            contextMenuRegistry.toggle('zoom-to-cursor', 'hide');
            contextMenuRegistry.toggle('pan-to-cursor', 'hide');
            contextMenuRegistry.toggle('reset-zoom', 'hide');
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

        this.updateZoom(userInteraction('contextmenu-zoom-to-cursor'), zoom);
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

        this.updateZoom(userInteraction('contextmenu-pan-to-cursor'), constrainZoom(newZoom));
    }

    private onResetZoom(_actionEvent: AgSeriesAreaContextMenuActionEvent) {
        this.zoomManager.resetZoom(userInteraction('contextmenu-reset'));
    }

    private iterateFindNextZoomAtPoint(origin: Point) {
        const { scrollingStep } = this.getModuleProperties();

        for (let i = scrollingStep; i <= 1 - scrollingStep; i += scrollingStep) {
            const zoom = this.getNextZoomAtPoint(origin, i);
            if (this.isZoomValid(zoom)) {
                return zoom;
            }
        }
    }

    private getNextZoomAtPoint(origin: Point, step: number) {
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
