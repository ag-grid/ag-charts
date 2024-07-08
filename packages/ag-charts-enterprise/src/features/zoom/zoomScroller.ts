import { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { AxisZoomStates, DefinedZoomState, ZoomProperties } from './zoomTypes';
import {
    constrainAxis,
    constrainZoom,
    definedZoomState,
    dx,
    dy,
    pointToRatio,
    scaleZoomAxisWithAnchor,
} from './zoomUtils';

export class ZoomScroller {
    updateAxes(
        event: _ModuleSupport.PointerInteractionEvent<'wheel'>,
        props: ZoomProperties,
        bbox: _Scene.BBox,
        zooms: AxisZoomStates
    ): AxisZoomStates {
        const sourceEvent = event.sourceEvent as WheelEvent;
        const newZooms: AxisZoomStates = {};
        const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;

        // Convert the cursor position to coordinates as a ratio of 0 to 1
        const origin = pointToRatio(
            bbox,
            sourceEvent.offsetX ?? sourceEvent.clientX,
            sourceEvent.offsetY ?? sourceEvent.clientY
        );

        for (const [axisId, { direction, zoom }] of Object.entries(zooms)) {
            if (zoom == null) continue;

            let newZoom = { ...zoom };

            const delta = scrollingStep * event.deltaY * (zoom.max - zoom.min);
            if (direction === _ModuleSupport.ChartAxisDirection.X && isScalingX) {
                newZoom.max += delta;
                newZoom = scaleZoomAxisWithAnchor(newZoom, zoom, anchorPointX, origin.x);
            } else if (direction === _ModuleSupport.ChartAxisDirection.Y && isScalingY) {
                newZoom.max += delta;
                newZoom = scaleZoomAxisWithAnchor(newZoom, zoom, anchorPointY, origin.y);
            } else {
                continue;
            }

            newZooms[axisId] = { direction, zoom: constrainAxis(newZoom) };
        }

        return newZooms;
    }

    update(
        event: _ModuleSupport.PointerInteractionEvent<'wheel'>,
        props: ZoomProperties,
        bbox: _Scene.BBox,
        oldZoom: DefinedZoomState
    ): DefinedZoomState {
        const sourceEvent = event.sourceEvent as WheelEvent;
        const { anchorPointX, anchorPointY, isScalingX, isScalingY, scrollingStep } = props;

        const origin = pointToRatio(
            bbox,
            sourceEvent.offsetX ?? sourceEvent.clientX,
            sourceEvent.offsetY ?? sourceEvent.clientY
        );

        // Scale the zoom bounding box
        const dir = event.deltaY;
        let newZoom = definedZoomState(oldZoom);
        newZoom.x.max += isScalingX ? scrollingStep * dir * dx(oldZoom) : 0;
        newZoom.y.max += isScalingY ? scrollingStep * dir * dy(oldZoom) : 0;

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

    updateDelta(delta: number, props: ZoomProperties, oldZoom: DefinedZoomState): DefinedZoomState {
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
