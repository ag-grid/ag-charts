import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { constrainZoom, definedZoomState, pointToRatio, scaleZoom, translateZoom } from './zoomTransformers';
import { DefinedZoomState, ZoomCoords } from './zoomTypes';
import { ZoomRect } from './scenes/zoomRect';

// "Re-rewind, when the crowd say..."
export class ZoomSelector {
    private rect: ZoomRect;
    private coords?: ZoomCoords;

    constructor(rect: ZoomRect) {
        this.rect = rect;
        this.rect.visible = false;
    }

    update(
        event: _ModuleSupport.InteractionEvent<'drag' | 'hover'>,
        minXRatio: number,
        minYRatio: number,
        isScalingX: boolean,
        isScalingY: boolean,
        bbox?: _Scene.BBox,
        currentZoom?: _ModuleSupport.AxisZoomState
    ): void {
        this.rect.visible = true;

        this.updateCoords(
            event.offsetX,
            event.offsetY,
            minXRatio,
            minYRatio,
            isScalingX,
            isScalingY,
            bbox,
            currentZoom
        );
        this.updateRect(bbox);
    }

    stop(bbox?: _Scene.BBox, currentZoom?: _ModuleSupport.AxisZoomState): DefinedZoomState {
        let zoom = definedZoomState();

        if (!bbox) return zoom;

        if (this.coords) {
            zoom = this.createZoomFromCoords(bbox, currentZoom);
        }

        this.reset();

        return zoom;
    }

    reset(): void {
        this.coords = undefined;
        this.rect.visible = false;
    }

    private updateCoords(
        x: number,
        y: number,
        minXRatio: number,
        minYRatio: number,
        isScalingX: boolean,
        isScalingY: boolean,
        bbox?: _Scene.BBox,
        currentZoom?: _ModuleSupport.AxisZoomState
    ): void {
        if (!this.coords) {
            this.coords = { x1: x, y1: y, x2: x, y2: y };
            return;
        }

        this.coords.x2 = x;
        this.coords.y2 = y;

        if (!bbox) return;

        // Ensure the selection is always at the same aspect ratio, using the width as the source of truth for the size
        // of the selection and limit it to the minimum dimensions.
        const zoom = definedZoomState(currentZoom);
        const normal = this.getNormalisedDimensions();

        const aspectRatio = bbox.width / bbox.height;

        const scaleX = zoom.x.max - zoom.x.min;
        const scaleY = zoom.y.max - zoom.y.min;

        const xRatio = minXRatio / scaleX;
        const yRatio = minYRatio / scaleY;

        if (normal.width / bbox.width < xRatio) {
            if (this.coords.x2 < this.coords.x1) {
                this.coords.x2 = this.coords.x1 - bbox.width * xRatio;
            } else {
                this.coords.x2 = this.coords.x1 + bbox.width * xRatio;
            }
        }

        // If only scaling on the y-axis, we switch to scaling using height as the source of truth, otherwise we scale
        // the height in relation to the aspect ratio
        if (isScalingY && !isScalingX) {
            if (normal.height / bbox.height < yRatio) {
                if (this.coords.y2 < this.coords.y1) {
                    this.coords.y2 = this.coords.y1 - bbox.width * xRatio;
                } else {
                    this.coords.y2 = this.coords.y1 + bbox.height * yRatio;
                }
            }
        } else if (this.coords.y2 < this.coords.y1) {
            this.coords.y2 = Math.min(
                this.coords.y1 - normal.width / aspectRatio,
                this.coords.y1 - bbox.height * yRatio
            );
        } else {
            this.coords.y2 = Math.max(
                this.coords.y1 + normal.width / aspectRatio,
                this.coords.y1 + bbox.height * yRatio
            );
        }

        // Finally we reset the coords to maximise if not scaling on either axis
        if (!isScalingX) {
            this.coords.x1 = bbox.x;
            this.coords.x2 = bbox.x + bbox.width;
        }

        if (!isScalingY) {
            this.coords.y1 = bbox.y;
            this.coords.y2 = bbox.y + bbox.height;
        }
    }

    private updateRect(bbox?: _Scene.BBox): void {
        if (!bbox) return;

        const { rect } = this;
        let { x, y, width, height } = this.getNormalisedDimensions();

        x = Math.max(x, bbox.x);
        x -= Math.max(0, x + width - (bbox.x + bbox.width));

        y = Math.max(y, bbox.y);
        y -= Math.max(0, y + height - (bbox.y + bbox.height));

        rect.x = x;
        rect.y = y;
        rect.width = width;
        rect.height = height;
    }

    private createZoomFromCoords(bbox: _Scene.BBox, currentZoom?: _ModuleSupport.AxisZoomState) {
        const oldZoom = definedZoomState(currentZoom);
        const normal = this.getNormalisedDimensions();

        // Convert the top-left position to coordinates as a ratio of 0 to 1 of the current zoom
        const origin = pointToRatio(bbox, normal.x, normal.y + normal.height);

        // Scale the zoom bounding box
        const xFactor = normal.width / bbox.width;
        const yFactor = normal.height / bbox.height;
        let newZoom = scaleZoom(oldZoom, xFactor, yFactor);

        // Translate the zoom bounding box by an amount scaled to the old zoom
        const translateX = origin.x * (oldZoom.x.max - oldZoom.x.min);
        const translateY = origin.y * (oldZoom.y.max - oldZoom.y.min);
        newZoom = translateZoom(newZoom, translateX, translateY);

        // Constrain the zoom bounding box to remain within the ultimate bounds of 0,0 and 1,1
        newZoom = constrainZoom(newZoom);

        return newZoom;
    }

    private getNormalisedDimensions() {
        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.coords ?? {};

        // Ensure we create a box starting at the top left corner
        const x = x1 <= x2 ? x1 : x2;
        const y = y1 <= y2 ? y1 : y2;
        const width = x1 <= x2 ? x2 - x1 : x1 - x2;
        const height = y1 <= y2 ? y2 - y1 : y1 - y2;

        return { x, y, width, height };
    }
}
