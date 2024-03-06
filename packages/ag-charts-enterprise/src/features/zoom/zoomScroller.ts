import type { AgZoomAnchorPoint, _ModuleSupport, _Scene } from 'ag-charts-community';

import type { DefinedZoomState } from './zoomTypes';
import {
    constrainZoom,
    definedZoomState,
    dx,
    dy,
    pointToRatio,
    scaleZoomAxisWithAnchor,
    scaleZoomAxisWithPoint,
} from './zoomUtils';

const DELTA_SCALE = 4;

export class ZoomScroller {
    update(
        event: _ModuleSupport.InteractionEvent<'wheel'>,
        step: number,
        anchorPointX: AgZoomAnchorPoint,
        anchorPointY: AgZoomAnchorPoint,
        isScalingX: boolean,
        isScalingY: boolean,
        bbox: _Scene.BBox,
        currentZoom?: _ModuleSupport.AxisZoomState
    ): DefinedZoomState {
        const oldZoom = definedZoomState(currentZoom);
        const sourceEvent = event.sourceEvent as WheelEvent;

        // Scale the zoom bounding box
        const dir = event.deltaY;
        let newZoom = definedZoomState(oldZoom);
        newZoom.x.max += isScalingX ? step * dir * dx(oldZoom) * DELTA_SCALE : 0;
        newZoom.y.max += isScalingY ? step * dir * dy(oldZoom) * DELTA_SCALE : 0;

        if ((anchorPointX === 'pointer' && isScalingX) || (anchorPointY === 'pointer' && isScalingY)) {
            newZoom = this.scaleZoomToPointer(sourceEvent, isScalingX, isScalingY, bbox, oldZoom, newZoom);
        } else {
            if (isScalingX) {
                newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchorPointX);
            }
            if (isScalingY) {
                newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchorPointY);
            }
        }

        // Constrain the zoom bounding box to remain within the ultimate bounds of 0,0 and 1,1
        newZoom = constrainZoom(newZoom);

        return newZoom;
    }

    private scaleZoomToPointer(
        sourceEvent: WheelEvent,
        isScalingX: boolean,
        isScalingY: boolean,
        bbox: _Scene.BBox,
        oldZoom: DefinedZoomState,
        newZoom: DefinedZoomState
    ) {
        // Convert the cursor position to coordinates as a ratio of 0 to 1
        const origin = pointToRatio(
            bbox,
            sourceEvent.offsetX ?? sourceEvent.clientX,
            sourceEvent.offsetY ?? sourceEvent.clientY
        );

        // Translate the zoom bounding box such that the cursor remains over the same position as before
        newZoom.x = isScalingX ? scaleZoomAxisWithPoint(newZoom.x, oldZoom.x, origin.x) : newZoom.x;
        newZoom.y = isScalingY ? scaleZoomAxisWithPoint(newZoom.y, oldZoom.y, origin.y) : newZoom.y;

        return newZoom;
    }
}
