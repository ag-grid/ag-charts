import type { _Scene } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { constrainZoom, definedZoomState, pointToRatio, translateZoom } from './zoomTransformers';
import type { ZoomCoords } from './zoomTypes';

export type Zooms = ReturnType<_ModuleSupport.ZoomManager['getAxisZooms']>;

export class ZoomPanner {
    public isPanning: boolean = false;

    private coords?: ZoomCoords;

    updateDrag(event: _ModuleSupport.InteractionEvent<'drag'>, bbox: _Scene.BBox, zooms: Zooms): Zooms {
        this.isPanning = true;

        this.updateCoords(event.offsetX, event.offsetY);
        return this.translateZooms(bbox, zooms);
    }

    updateHScroll(sourceEvent: { deltaX: number; deltaMode: number }, bbox: _Scene.BBox, zooms: Zooms): Zooms {
        this.isPanning = true;

        const pixelFactor = sourceEvent.deltaMode === 0 ? 1 : 10;
        const deltaX = sourceEvent.deltaX * pixelFactor;

        this.updateCoords((this.coords?.x2 ?? 0) - deltaX, 0);
        return this.translateZooms(bbox, zooms);
    }

    stop() {
        this.isPanning = false;
        this.coords = undefined;
    }

    private updateCoords(x: number, y: number): void {
        if (!this.coords) {
            this.coords = { x1: x, y1: y, x2: x, y2: y };
        } else {
            this.coords.x1 = this.coords.x2;
            this.coords.y1 = this.coords.y2;
            this.coords.x2 = x;
            this.coords.y2 = y;
        }
    }

    private translateZooms(bbox: _Scene.BBox, currentZooms: Zooms) {
        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.coords ?? {};

        const dx = x1 <= x2 ? x2 - x1 : x1 - x2;
        const dy = y1 <= y2 ? y2 - y1 : y1 - y2;

        const offset = pointToRatio(bbox, bbox.x + dx, bbox.y + bbox.height - dy);

        const offsetX = x1 <= x2 ? -offset.x : offset.x;
        const offsetY = y1 <= y2 ? offset.y : -offset.y;

        const newZooms: Zooms = {};

        for (const [axisId, { direction, zoom: currentZoom }] of Object.entries(currentZooms)) {
            let zoom;
            if (direction === _ModuleSupport.ChartAxisDirection.X) {
                zoom = definedZoomState({ x: currentZoom });
            } else {
                zoom = definedZoomState({ y: currentZoom });
            }

            const scaleX = zoom.x.max - zoom.x.min;
            const scaleY = zoom.y.max - zoom.y.min;

            zoom = constrainZoom(translateZoom(zoom, offsetX * scaleX, offsetY * scaleY));

            if (direction === _ModuleSupport.ChartAxisDirection.X) {
                newZooms[axisId] = { direction, zoom: zoom.x };
            } else {
                newZooms[axisId] = { direction, zoom: zoom.y };
            }
        }

        return newZooms;
    }
}
