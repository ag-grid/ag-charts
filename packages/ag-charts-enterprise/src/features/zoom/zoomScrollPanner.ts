import { _ModuleSupport } from 'ag-charts-community';

import type { AxisZoomStates } from './zoomTypes';
import { constrainZoom, definedZoomState, dx, pointToRatio, translateZoom } from './zoomUtils';

const DELTA_SCALE = 200;

export class ZoomScrollPanner {
    update(event: { deltaX: number }, step: number, bbox: _ModuleSupport.BBox, zooms: AxisZoomStates): AxisZoomStates {
        const deltaX = event.deltaX * step * DELTA_SCALE;
        return this.translateZooms(bbox, zooms, deltaX);
    }

    private translateZooms(bbox: _ModuleSupport.BBox, currentZooms: AxisZoomStates, deltaX: number) {
        const newZooms: AxisZoomStates = {};

        const offset = pointToRatio(bbox, bbox.x + Math.abs(deltaX), 0);
        const offsetX = deltaX < 0 ? -offset.x : offset.x;

        for (const [axisId, { direction, zoom: currentZoom }] of Object.entries(currentZooms)) {
            if (direction !== _ModuleSupport.ChartAxisDirection.X) continue;

            let zoom = definedZoomState({ x: currentZoom });
            zoom = constrainZoom(translateZoom(zoom, offsetX * dx(zoom), 0));
            newZooms[axisId] = { direction, zoom: zoom.x };
        }

        return newZooms;
    }
}
