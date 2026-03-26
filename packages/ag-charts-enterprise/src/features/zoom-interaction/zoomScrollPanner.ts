import { _ModuleSupport, _Widget } from 'ag-charts-community';
import { definedZoomState, entries } from 'ag-charts-core';
import type { BoxBounds } from 'ag-charts-core';

import { constrainZoom, dx, dy, pointToRatio, translateZoom } from '../zoom/zoomUtils';

type State = _ModuleSupport.CoreZoomState;
type StateRetrieval = _ModuleSupport.CoreZoomStateSafeRetrieval;

const DELTA_SCALE = 200;

export class ZoomScrollPanner {
    update(
        event: _Widget.WheelWidgetEvent,
        step: number,
        mode: 'pan' | 'zoom',
        bbox: BoxBounds,
        zooms: StateRetrieval
    ): State {
        const deltaX = event.deltaX * step * DELTA_SCALE;

        // Remove the deltaY component if scrolling mode is zoom, to prevent leaking y scrolling when using a trackpad.
        const deltaY = mode === 'zoom' ? 0 : event.deltaY * step * DELTA_SCALE;

        return this.translateZooms(bbox, zooms, deltaX, deltaY);
    }

    private translateZooms(bbox: BoxBounds, currentZooms: StateRetrieval, deltaX: number, deltaY: number) {
        const newZooms: State = {};

        const offset = pointToRatio(bbox, bbox.x + Math.abs(deltaX), bbox.y + bbox.height - Math.abs(deltaY));

        const offsetX = deltaX < 0 ? -offset.x : offset.x;
        const offsetY = deltaY < 0 ? offset.y : -offset.y;

        for (const [axisId, value] of entries(currentZooms)) {
            if (!value) continue;

            const { direction, min, max } = value;

            let zoom = definedZoomState({ [value.direction]: { min, max } });
            zoom = constrainZoom(translateZoom(zoom, offsetX * dx(zoom), offsetY * dy(zoom)));
            newZooms[axisId] = { direction, min: zoom[value.direction].min, max: zoom[value.direction].max };
        }

        return newZooms;
    }
}
