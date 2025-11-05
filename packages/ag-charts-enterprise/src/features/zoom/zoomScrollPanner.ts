import { _ModuleSupport } from 'ag-charts-community';
import { entries } from 'ag-charts-core';

import { constrainZoom, definedZoomState, dx, pointToRatio, translateZoom } from './zoomUtils';

type State = _ModuleSupport.CoreZoomState;
type StateRetrieval = _ModuleSupport.CoreZoomStateSafeRetrieval;

const DELTA_SCALE = 200;

export class ZoomScrollPanner {
    update(event: { deltaX: number }, step: number, bbox: _ModuleSupport.BBox, zooms: StateRetrieval): State {
        const deltaX = event.deltaX * step * DELTA_SCALE;
        return this.translateZooms(bbox, zooms, deltaX);
    }

    private translateZooms(bbox: _ModuleSupport.BBox, currentZooms: StateRetrieval, deltaX: number) {
        const newZooms: State = {};

        const offset = pointToRatio(bbox, bbox.x + Math.abs(deltaX), 0);
        const offsetX = deltaX < 0 ? -offset.x : offset.x;

        for (const [axisId, value] of entries(currentZooms)) {
            if (value?.direction !== _ModuleSupport.ChartAxisDirection.X) continue;
            const { direction, min, max } = value;

            let zoom = definedZoomState({ x: { min, max } });
            zoom = constrainZoom(translateZoom(zoom, offsetX * dx(zoom), 0));
            newZooms[axisId] = { direction, min: zoom.x.min, max: zoom.x.max };
        }

        return newZooms;
    }
}
