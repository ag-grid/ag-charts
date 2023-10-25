import type { AgZoomAnchorPoint, _Scene } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { constrainZoom, definedZoomState, pointToRatio, scaleZoomAxisWithAnchor } from './zoomTransformers';
import type { DefinedZoomState, ZoomCoords } from './zoomTypes';

export class ZoomAxisDragger {
    public isAxisDragging: boolean = false;

    private coords?: ZoomCoords;
    private oldZoom?: DefinedZoomState;

    update(
        event: _ModuleSupport.InteractionEvent<'drag'>,
        direction: _ModuleSupport.ChartAxisDirection,
        anchor: AgZoomAnchorPoint,
        bbox: _Scene.BBox,
        zoom?: _ModuleSupport.AxisZoomState,
        axisZoom?: _ModuleSupport.ZoomState
    ): _ModuleSupport.ZoomState {
        this.isAxisDragging = true;

        // Store the initial zoom state, merged with the state for this axis
        if (this.oldZoom == null) {
            if (direction === _ModuleSupport.ChartAxisDirection.X) {
                this.oldZoom = definedZoomState({ ...zoom, x: axisZoom });
            } else {
                this.oldZoom = definedZoomState({ ...zoom, y: axisZoom });
            }
        }

        this.updateCoords(event.offsetX, event.offsetY);
        return this.updateZoom(direction, anchor, bbox);
    }

    stop() {
        this.isAxisDragging = false;
        this.coords = undefined;
        this.oldZoom = undefined;
    }

    private updateCoords(x: number, y: number): void {
        if (!this.coords) {
            this.coords = { x1: x, y1: y, x2: x, y2: y };
        } else {
            this.coords.x2 = x;
            this.coords.y2 = y;
        }
    }

    private updateZoom(
        direction: _ModuleSupport.ChartAxisDirection,
        anchor: AgZoomAnchorPoint,
        bbox: _Scene.BBox
    ): _ModuleSupport.ZoomState {
        const { coords, oldZoom } = this;

        let newZoom = definedZoomState(oldZoom);

        if (!coords || !oldZoom) {
            if (direction === _ModuleSupport.ChartAxisDirection.X) return newZoom.x;
            return newZoom.y;
        }

        // Scale the zoom along the given axis, anchoring on the end of the axis
        const origin = pointToRatio(bbox, coords.x1, coords.y1);
        const target = pointToRatio(bbox, coords.x2, coords.y2);

        if (direction === _ModuleSupport.ChartAxisDirection.X) {
            const scaleX = target.x - origin.x;

            newZoom.x.max += scaleX;
            newZoom.x = scaleZoomAxisWithAnchor(newZoom.x, oldZoom.x, anchor === 'pointer' ? 'end' : anchor);
            newZoom = constrainZoom(newZoom);

            return newZoom.x;
        }

        const scaleY = target.y - origin.y;

        newZoom.y.max -= scaleY;
        newZoom.y = scaleZoomAxisWithAnchor(newZoom.y, oldZoom.y, anchor === 'pointer' ? 'middle' : anchor);
        newZoom = constrainZoom(newZoom);

        return newZoom.y;
    }
}
