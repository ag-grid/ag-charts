import type { _ModuleSupport, _Scene } from 'ag-charts-community';

import {
    constrainZoom,
    definedZoomState,
    pointToRatio,
    scaleZoomAxisWithAnchor,
    translateZoom,
} from './zoomTransformers';
import type { AnchorPoint, DefinedZoomState } from './zoomTypes';

export class ZoomScroller {
    update(
        event: _ModuleSupport.InteractionEvent<'wheel'>,
        step: number,
        anchorPointX: AnchorPoint,
        anchorPointY: AnchorPoint,
        isScalingX: boolean,
        isScalingY: boolean,
        bbox: _Scene.BBox,
        currentZoom?: _ModuleSupport.AxisZoomState
    ): DefinedZoomState {
        const oldZoom = definedZoomState(currentZoom);
        const sourceEvent = event.sourceEvent as WheelEvent;

        // Scale the zoom bounding box
        const dir = sourceEvent.deltaY < 0 ? -1 : 1;
        let newZoom = definedZoomState(oldZoom);
        newZoom.x.max += isScalingX ? step * dir : 0;
        newZoom.y.max += isScalingY ? step * dir : 0;

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
        const scaledOriginX = origin.x * (1 - (oldZoom.x.max - oldZoom.x.min - (newZoom.x.max - newZoom.x.min)));
        const scaledOriginY = origin.y * (1 - (oldZoom.y.max - oldZoom.y.min - (newZoom.y.max - newZoom.y.min)));

        const translateX = isScalingX ? origin.x - scaledOriginX : 0;
        const translateY = isScalingY ? origin.y - scaledOriginY : 0;

        return translateZoom(newZoom, translateX, translateY);
    }
}
