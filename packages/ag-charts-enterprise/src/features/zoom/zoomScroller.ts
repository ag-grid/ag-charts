import type { _ModuleSupport, _Scene } from 'ag-charts-community';

import { constrainZoom, definedZoomState, pointToRatio, translateZoom } from './zoomTransformers';
import type { AnchorPoint, DefinedZoomState } from './zoomTypes';

export class ZoomScroller {
    update(
        event: _ModuleSupport.InteractionEvent<'wheel'>,
        step: number,
        anchor: { x: AnchorPoint; y: AnchorPoint },
        isScalingX: boolean,
        isScalingY: boolean,
        bbox: _Scene.BBox,
        currentZoom?: _ModuleSupport.AxisZoomState
    ): DefinedZoomState {
        const oldZoom = definedZoomState(currentZoom);

        const sourceEvent = event.sourceEvent as WheelEvent;

        // Convert the cursor position to coordinates as a ratio of 0 to 1
        const origin = pointToRatio(
            bbox,
            sourceEvent.offsetX ?? sourceEvent.clientX,
            sourceEvent.offsetY ?? sourceEvent.clientY
        );

        // Scale the zoom bounding box
        const dir = sourceEvent.deltaY < 0 ? -1 : 1;
        let newZoom = definedZoomState(oldZoom);
        newZoom.x.max += isScalingX ? step * dir : 0;
        newZoom.y.max += isScalingY ? step * dir : 0;

        if ((anchor.x === 'pointer' && isScalingX) || (anchor.y === 'pointer' && isScalingY)) {
            // Translate the zoom bounding box such that the cursor remains over the same position as before
            const scaledOriginX = origin.x * (1 - (oldZoom.x.max - oldZoom.x.min - (newZoom.x.max - newZoom.x.min)));
            const scaledOriginY = origin.y * (1 - (oldZoom.y.max - oldZoom.y.min - (newZoom.y.max - newZoom.y.min)));

            const translateX = isScalingX ? origin.x - scaledOriginX : 0;
            const translateY = isScalingY ? origin.y - scaledOriginY : 0;

            newZoom = translateZoom(newZoom, translateX, translateY);
        } else {
            if (isScalingX) {
                newZoom.x = this.scaleAxisWithAnchor(newZoom.x, oldZoom.x, anchor.x);
            }
            if (isScalingY) {
                newZoom.y = this.scaleAxisWithAnchor(newZoom.y, oldZoom.y, anchor.y);
            }
        }

        // Constrain the zoom bounding box to remain within the ultimate bounds of 0,0 and 1,1
        newZoom = constrainZoom(newZoom);

        return newZoom;
    }

    private scaleAxisWithAnchor(
        from: { min: number; max: number },
        to: { min: number; max: number },
        anchor: AnchorPoint
    ) {
        let { min, max } = to;
        const diff = from.max - from.min;

        if (anchor === 'start') {
            max = to.min + diff;
        } else if (anchor === 'middle') {
            min = 0.5 - diff / 2;
            max = 0.5 + diff / 2;
        } else if (anchor === 'end') {
            min = to.max - diff;
        }

        return { min, max };
    }
}
