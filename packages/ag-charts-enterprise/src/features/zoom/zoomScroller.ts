import { _ModuleSupport, _Widget } from 'ag-charts-community';
import { ChartAxisDirection, definedZoomState, entries } from 'ag-charts-core';
import type { BoxBounds, DefinedViewportState } from 'ag-charts-core';

import type { ZoomProperties } from './zoomTypes';
import { constrainAxis, constrainZoom, dx, dy, pointToRatio, scaleZoomAxisWithAnchor } from './zoomUtils';

type State = _ModuleSupport.CoreZoomState;
type StateRetrieval = _ModuleSupport.CoreZoomStateSafeRetrieval;

export class ZoomScroller {
    updateAxes(event: _Widget.WheelWidgetEvent, props: ZoomProperties, bbox: BoxBounds, zooms: StateRetrieval): State {
        const sourceEvent = event.sourceEvent;
        const newZooms: State = {};
        const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;

        // Convert the cursor position to coordinates as a ratio of 0 to 1
        const origin = pointToRatio(
            bbox,
            sourceEvent.offsetX ?? sourceEvent.clientX,
            sourceEvent.offsetY ?? sourceEvent.clientY
        );

        for (const [axisId, value] of entries(zooms)) {
            if (value == null) continue;
            const { direction, min, max } = value;

            let newZoom = { min, max };

            const delta = scrollingStep * event.deltaY * (max - min);

            if (direction === ChartAxisDirection.X && isScalingX) {
                newZoom.max += delta;
                newZoom = scaleZoomAxisWithAnchor(newZoom, value, anchorPointX, origin.x);
            } else if (direction === ChartAxisDirection.Y && isScalingY) {
                newZoom.max += delta;
                newZoom = scaleZoomAxisWithAnchor(newZoom, value, anchorPointY, origin.y);
            } else {
                continue;
            }

            // @todo(AG-15397) - We don't have a way to normalize this zoom yet, so we'll just discard the zoom event
            if (newZoom.max < newZoom.min) continue;

            const constrained = constrainAxis(newZoom);
            newZooms[axisId] = { direction, min: constrained.min, max: constrained.max };
        }

        return newZooms;
    }

    update(
        event: _Widget.WheelWidgetEvent,
        props: ZoomProperties,
        bbox: BoxBounds,
        oldZoom: DefinedViewportState
    ): DefinedViewportState | undefined {
        const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;

        const canvasX = event.offsetX + bbox.x;
        const canvasY = event.offsetY + bbox.y;
        const origin = pointToRatio(bbox, canvasX, canvasY);

        // Scale the zoom bounding box
        const dir = event.deltaY;
        let newZoom = definedZoomState(oldZoom);
        newZoom.x.max += isScalingX ? scrollingStep * dir * dx(oldZoom) : 0;
        newZoom.y.max += isScalingY ? scrollingStep * dir * dy(oldZoom) : 0;

        // @todo(AG-15397) - We don't have a way to normalize this zoom yet, so we'll just discard the zoom event
        if (newZoom.x.max < newZoom.x.min || newZoom.y.max < newZoom.y.min) return;

        if (isScalingX) {
            newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchorPointX, origin.x);
        }
        if (isScalingY) {
            newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchorPointY, origin.y);
        }

        // Constrain the zoom bounding box to remain within the ultimate bounds of 0,0 and 1,1
        newZoom = constrainZoom(newZoom);

        return newZoom;
    }

    updateDelta(delta: number, props: ZoomProperties, oldZoom: DefinedViewportState): DefinedViewportState {
        const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;

        // Scale the zoom bounding box
        let newZoom = definedZoomState(oldZoom);
        newZoom.x.max += isScalingX ? scrollingStep * -delta * dx(oldZoom) : 0;
        newZoom.y.max += isScalingY ? scrollingStep * -delta * dy(oldZoom) : 0;

        if (isScalingX) {
            newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchorPointX);
        }
        if (isScalingY) {
            newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchorPointY);
        }

        // Constrain the zoom bounding box to remain within the ultimate bounds of 0,0 and 1,1
        newZoom = constrainZoom(newZoom);

        return newZoom;
    }
}
