import type { _Scene } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import type { AxisZoomStates, ZoomCoords } from './zoomTypes';
import { constrainZoom, definedZoomState, dx, dy, pointToRatio, translateZoom } from './zoomUtils';

export class ZoomPanner {
    public isPanning: boolean = false;
    private coords?: ZoomCoords;

    update(event: _ModuleSupport.InteractionEvent<'drag'>, bbox: _Scene.BBox, zooms: AxisZoomStates): AxisZoomStates {
        this.isPanning = true;
        this.updateCoords(event.offsetX, event.offsetY);
        return this.translateZooms(bbox, zooms);
    }

    stop() {
        this.isPanning = false;
        this.coords = undefined;
    }

    private updateCoords(x: number, y: number) {
        if (!this.coords) {
            this.coords = { x1: x, y1: y, x2: x, y2: y };
        } else {
            this.coords = { x1: this.coords.x2, y1: this.coords.y2, x2: x, y2: y };
        }
    }

    private translateZooms(bbox: _Scene.BBox, currentZooms: AxisZoomStates) {
        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.coords ?? {};

        const dx_ = x1 <= x2 ? x2 - x1 : x1 - x2;
        const dy_ = y1 <= y2 ? y2 - y1 : y1 - y2;

        const offset = pointToRatio(bbox, bbox.x + dx_, bbox.y + bbox.height - dy_);

        const offsetX = x1 <= x2 ? -offset.x : offset.x;
        const offsetY = y1 <= y2 ? offset.y : -offset.y;

        const newZooms: AxisZoomStates = {};

        for (const [axisId, { direction, zoom: currentZoom }] of Object.entries(currentZooms)) {
            let zoom;
            if (direction === _ModuleSupport.ChartAxisDirection.X) {
                zoom = definedZoomState({ x: currentZoom });
            } else {
                zoom = definedZoomState({ y: currentZoom });
            }

            zoom = constrainZoom(translateZoom(zoom, offsetX * dx(zoom), offsetY * dy(zoom)));

            if (direction === _ModuleSupport.ChartAxisDirection.X) {
                newZooms[axisId] = { direction, zoom: zoom.x };
            } else {
                newZooms[axisId] = { direction, zoom: zoom.y };
            }
        }

        return newZooms;
    }
}
