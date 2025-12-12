import type { _ModuleSupport } from 'ag-charts-community';
import { definedZoomState } from 'ag-charts-core';
import type { AxisZoomState, BoxBounds, DefinedZoomState } from 'ag-charts-core';

import type { ZoomRect } from './scenes/zoomRect';
import type { ZoomCoords, ZoomProperties } from './zoomTypes';
import { constrainZoom, dx, dy, multiplyZoom, pointToRatio, scaleZoom, translateZoom } from './zoomUtils';

// "Re-rewind, when the crowd say..."
export class ZoomSelector {
    private coords?: ZoomCoords;

    constructor(
        private readonly rect: ZoomRect,
        private readonly getZoom: () => DefinedZoomState,
        private readonly isZoomValid: (zoom: DefinedZoomState) => boolean
    ) {
        this.rect.visible = false;
    }

    update(event: { currentX: number; currentY: number }, props: ZoomProperties, bbox?: BoxBounds): void {
        const canvasX = event.currentX + (bbox?.x ?? 0);
        const canvasY = event.currentY + (bbox?.y ?? 0);
        this.rect.visible = true;

        this.updateCoords(canvasX, canvasY, props, bbox);
        this.updateRect(bbox);
    }

    stop(innerBBox?: BoxBounds, bbox?: BoxBounds, currentZoom?: AxisZoomState): DefinedZoomState | undefined {
        let zoom = definedZoomState();

        if (!innerBBox || !bbox) return zoom;

        if (this.coords) {
            zoom = this.createZoomFromCoords(bbox, currentZoom);
        }

        // Zoom is a ratio of the inner unpadded series area, but selection encompasses the padded area. So here we need
        // to multiply it by the ratios of the outer and inner areas. Note: we don't use the `scaleZoom()` method as
        // we need to combine translation and scale into a single operation to ensure the correct result.
        const multiplyX = bbox.width / innerBBox.width;
        const multiplyY = bbox.height / innerBBox.height;
        zoom = constrainZoom(multiplyZoom(zoom, multiplyX, multiplyY));

        this.reset();

        if (this.isZoomValid(zoom)) {
            return zoom;
        }
    }

    reset(): void {
        this.coords = undefined;
        this.rect.visible = false;
    }

    didUpdate(): boolean {
        return this.rect.visible && this.rect.width > 0 && this.rect.height > 0;
    }

    private updateCoords(x: number, y: number, props: ZoomProperties, bbox?: BoxBounds): void {
        if (!this.coords) {
            this.coords = { x1: x, y1: y, x2: x, y2: y };
            return;
        }

        const { coords } = this;

        coords.x2 = x;
        coords.y2 = y;

        if (!bbox) return;

        const { isScalingX, isScalingY, keepAspectRatio } = props;

        const normal = this.getNormalisedDimensions();

        // We only keep the aspect ratio if we are scaling on both axes, since we will maximise unscaled axes.
        if (keepAspectRatio && isScalingX && isScalingY) {
            const aspectRatio = bbox.width / bbox.height;
            if (coords.y2 < coords.y1) {
                coords.y2 = Math.min(coords.y1 - normal.width / aspectRatio, coords.y1);
            } else {
                coords.y2 = Math.max(coords.y1 + normal.width / aspectRatio, coords.y1);
            }
        }

        // Finally we reset the coords to maximise if not scaling on either axis
        if (!isScalingX) {
            coords.x1 = bbox.x;
            coords.x2 = bbox.x + bbox.width;
        }

        if (!isScalingY) {
            coords.y1 = bbox.y;
            coords.y2 = bbox.y + bbox.height;
        }
    }

    private updateRect(bbox?: BoxBounds): void {
        if (!bbox) return;

        const { rect } = this;
        const normal = this.getNormalisedDimensions();
        const { width, height } = normal;
        let { x, y } = normal;

        x = Math.max(x, bbox.x);
        x -= Math.max(0, x + width - (bbox.x + bbox.width));

        y = Math.max(y, bbox.y);
        y -= Math.max(0, y + height - (bbox.y + bbox.height));

        rect.x = x;
        rect.y = y;
        rect.width = width;
        rect.height = height;

        const zoom = this.createZoomFromCoords(bbox, this.getZoom());
        if (this.isZoomValid(zoom)) {
            rect.updateValid();
        } else {
            rect.updateInvalid();
        }
    }

    private createZoomFromCoords(bbox: BoxBounds, currentZoom?: AxisZoomState) {
        const oldZoom = definedZoomState(currentZoom);
        const normal = this.getNormalisedDimensions();

        // Convert the top-left position to coordinates as a ratio of 0 to 1 of the current zoom
        const origin = pointToRatio(bbox, normal.x, normal.y + normal.height);

        // Scale the zoom bounding box
        const xFactor = normal.width / bbox.width;
        const yFactor = normal.height / bbox.height;
        let newZoom = scaleZoom(oldZoom, xFactor, yFactor);

        // Translate the zoom bounding box by an amount scaled to the old zoom
        const translateX = origin.x * dx(oldZoom);
        const translateY = origin.y * dy(oldZoom);
        newZoom = translateZoom(newZoom, translateX, translateY);

        // Constrain the zoom bounding box to remain within the ultimate bounds of 0,0 and 1,1
        newZoom = constrainZoom(newZoom);

        return newZoom;
    }

    private getNormalisedDimensions() {
        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.coords ?? {};

        // Ensure we create a box starting at the top left corner
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const width = x1 <= x2 ? x2 - x1 : x1 - x2;
        const height = y1 <= y2 ? y2 - y1 : y1 - y2;

        return { x, y, width, height };
    }
}
