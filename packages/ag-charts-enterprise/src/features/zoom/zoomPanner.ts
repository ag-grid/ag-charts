import type { _Scene } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { constrainZoom, definedZoomState, pointToRatio, translateZoom } from './zoomTransformers';
import type { ZoomCoords } from './zoomTypes';

export type Zooms = ReturnType<_ModuleSupport.ZoomManager['getAxisZooms']>;

export class ZoomPanner {
    public isPanning: boolean = false;

    // Mouse drag actions have a 'start' and 'stop' event. `dragCoord` is initialised whenever
    // drag starts, and is reset to `undefined` once the drag stops.
    private dragCoords?: ZoomCoords;
    // Horizontal scrolling however does not have a 'start' and 'stop' event, it simply pans
    // by a fixed deltaX value whenever an event is fired.
    private hscrollCoords: ZoomCoords = { x1: 0, x2: 0, y1: 0, y2: 0 };

    updateDrag(event: _ModuleSupport.InteractionEvent<'drag'>, bbox: _Scene.BBox, zooms: Zooms): Zooms {
        this.isPanning = true;

        const { offsetX: x, offsetY: y } = event;
        if (this.dragCoords) {
            this.dragCoords.x1 = this.dragCoords.x2;
            this.dragCoords.y1 = this.dragCoords.y2;
            this.dragCoords.x2 = x;
            this.dragCoords.y2 = y;
        } else {
            this.dragCoords = { x1: x, y1: y, x2: x, y2: y };
        }
        return this.translateZooms(bbox, zooms, this.dragCoords);
    }

    updateHScroll(deltaX: number, bbox: _Scene.BBox, zooms: Zooms): Zooms {
        this.isPanning = true;
        this.hscrollCoords.x1 = deltaX * 5;
        return this.translateZooms(bbox, zooms, this.hscrollCoords);
    }

    stop() {
        this.isPanning = false;
        this.dragCoords = undefined;
    }

    private translateZooms(bbox: _Scene.BBox, currentZooms: Zooms, coords: ZoomCoords) {
        const { x1, y1, x2, y2 } = coords;

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
