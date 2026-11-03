import { clamp } from '../data/numbers';
import type { Bounds4 } from '../types/scene';
import type { BoxBounds } from './boxBounds';
import * as Vec4 from './vector4';

export enum PanToBBoxScalingModeEnum {
    None,
    WhenViewportTooSmallScaleXYProportionally,
    WhenViewportTooSmallScaleXYDisproportionally,
}

type Ratios = { min: number; max: number };
type XYRatios = { x: Ratios; y: Ratios };
type NeedsScaling = { x: boolean; y: boolean };

function normalize(screenMin: number, min: number, screenMax: number, max: number, target: number): number {
    return min + (max - min) * ((target - screenMin) / (screenMax - screenMin));
}

function unnormalize(screenMin: number, min: number, screenMax: number, max: number, ratio: number): number {
    return screenMin + (ratio - min) * ((screenMax - screenMin) / (max - min));
}

function calcWorldAxis(viewportMin: number, viewportMax: number, ratio: Ratios): [number, number] {
    return [
        unnormalize(viewportMin, ratio.min, viewportMax, ratio.max, 0),
        unnormalize(viewportMin, ratio.min, viewportMax, ratio.max, 1),
    ];
}

function calcWorldVec4(viewport: Bounds4, ratioX: Ratios, ratioY: Ratios): Bounds4 {
    const [x1, x2] = calcWorldAxis(viewport.x1, viewport.x2, ratioX);
    const [y1, y2] = calcWorldAxis(viewport.y1, viewport.y2, ratioY);
    return { x1, x2, y1, y2 };
}

function calcNeedsScaling(viewportBBox: BoxBounds, targetBBox: BoxBounds): NeedsScaling {
    const x = targetBBox.width > viewportBBox.width;
    const y = targetBBox.height > viewportBBox.height;
    return { x, y };
}

/* Pan viewport min (unnormalised, i.e. pixel coords.) by the smallest amount
   such that the viewport range includes the input target range but clamped at
   the world range. The function assumes:
   1)  worldMin <= viewportMin <= viewportMax <= worldMax
   2)  (viewportMax - viewportMin) >= (targetMax - targetMin)
*/
function panAxisUnnormalized(
    worldMin: number,
    worldMax: number,
    viewportMin: number,
    viewportMax: number,
    targetMin: number,
    targetMax: number
): number {
    if (viewportMin <= targetMin && targetMax <= viewportMax) return viewportMin;
    const minDiff = targetMin - viewportMin;
    const maxDiff = targetMax - viewportMax;
    const diff = Math.abs(minDiff) < Math.abs(maxDiff) ? minDiff : maxDiff;
    return clamp(worldMin, viewportMin + diff, worldMax);
}

/* Call panAxisUnnormalized for both x and y axes */
function panAxesUnnormalized(
    viewport: Bounds4,
    zoomRect: Bounds4,
    target: Bounds4,
    ratioX: Ratios,
    ratioY: Ratios
): { x: number; y: number } {
    const world = calcWorldVec4(zoomRect, ratioX, ratioY);
    // The world bounds the zoom rect's origin, so offset it to bound the viewport's origin (letterbox margins).
    const offsetX = zoomRect.x1 - viewport.x1;
    const offsetY = zoomRect.y1 - viewport.y1;
    return {
        x: panAxisUnnormalized(world.x1 - offsetX, world.x2 - offsetX, viewport.x1, viewport.x2, target.x1, target.x2),
        y: panAxisUnnormalized(world.y1 - offsetY, world.y2 - offsetY, viewport.y1, viewport.y2, target.y1, target.y2),
    };
}

// Screen-space is y-down but zoom ratios are y-up; mirroring about the viewport's centre-line
// keeps the viewport fixed while letting `viewport.y1` map to `ratio.min` below.
function flipY(viewportBBox: BoxBounds, bbox: BoxBounds): BoxBounds {
    return {
        x: bbox.x,
        y: 2 * viewportBBox.y + viewportBBox.height - bbox.y - bbox.height,
        width: bbox.width,
        height: bbox.height,
    };
}

// The calculations of the new desired viewport (i.e. ZoomMinMax) is done in pixel coords (unnormalised).
// The desired (x, y) for the new viewport is found, the pixel coords are converted into normalized values.
// `screenZoomRectBBox` is the pixel rect `ratios` span, smaller than the viewport when letterboxed (e.g. maps).
export function calcPanToBBoxRatios(
    scalingMode: PanToBBoxScalingModeEnum,
    viewportBBox: BoxBounds,
    ratios: Partial<XYRatios>,
    screenTargetBBox: BoxBounds,
    screenZoomRectBBox: BoxBounds = viewportBBox
): XYRatios {
    const targetBBox = flipY(viewportBBox, screenTargetBBox);
    const zoomRectBBox = flipY(viewportBBox, screenZoomRectBBox);
    switch (scalingMode) {
        case PanToBBoxScalingModeEnum.None:
            return calcPanToBBoxRatiosNoScale(viewportBBox, zoomRectBBox, ratios, targetBBox);

        case PanToBBoxScalingModeEnum.WhenViewportTooSmallScaleXYProportionally:
            return calcPanToBBoxRatiosScaleProportionally(viewportBBox, zoomRectBBox, ratios, targetBBox);

        case PanToBBoxScalingModeEnum.WhenViewportTooSmallScaleXYDisproportionally:
            return calcPanToBBoxRatiosScaleDisproportionally(viewportBBox, zoomRectBBox, ratios, targetBBox);

        default:
            return scalingMode satisfies never; // unreachable
    }
}

/* Shift the zoom rect's [min, max] by `delta` pixels and convert the result into ratios. */
function panRatios(zoomRectMin: number, zoomRectMax: number, ratio: Ratios, delta: number): Ratios {
    return {
        min: normalize(zoomRectMin, ratio.min, zoomRectMax, ratio.max, zoomRectMin + delta),
        max: normalize(zoomRectMin, ratio.min, zoomRectMax, ratio.max, zoomRectMax + delta),
    };
}

function calcPanToBBoxRatiosWithScaling(
    assignToViewport: NeedsScaling,
    viewportBBox: BoxBounds,
    zoomRectBBox: BoxBounds,
    ratios: Partial<XYRatios>,
    targetBBox: BoxBounds
): XYRatios {
    const { x: ratioX = { min: 0, max: 1 }, y: ratioY = { min: 0, max: 1 } } = ratios;

    const target = Vec4.from(targetBBox);
    const viewport = Vec4.from(viewportBBox);
    const zoomRect = Vec4.from(zoomRectBBox);
    const pan = panAxesUnnormalized(viewport, zoomRect, target, ratioX, ratioY);

    const result: XYRatios = {
        x: assignToViewport.x
            ? { min: ratioX.min, max: ratioX.max }
            : panRatios(zoomRect.x1, zoomRect.x2, ratioX, pan.x - viewport.x1),
        y: assignToViewport.y
            ? { min: ratioY.min, max: ratioY.max }
            : panRatios(zoomRect.y1, zoomRect.y2, ratioY, pan.y - viewport.y1),
    };

    // [min, max] are in the [0, 1] range while preserving the (max - min) difference.
    const diffX = result.x.max - result.x.min;
    const diffY = result.y.max - result.y.min;
    result.x.min = clamp(0, result.x.min, 1 - diffX);
    result.x.max = result.x.min + diffX;
    result.y.min = clamp(0, result.y.min, 1 - diffY);
    result.y.max = result.y.min + diffY;

    return result;
}

function calcPanToBBoxRatiosNoScale(
    viewportBBox: BoxBounds,
    zoomRectBBox: BoxBounds,
    ratios: Partial<XYRatios>,
    targetBBox: BoxBounds
): XYRatios {
    return calcPanToBBoxRatiosWithScaling({ x: false, y: false }, viewportBBox, zoomRectBBox, ratios, targetBBox);
}

function calcPanToBBoxRatiosScaleDisproportionally(
    viewportBBox: BoxBounds,
    zoomRectBBox: BoxBounds,
    ratios: Partial<XYRatios>,
    targetBBox: BoxBounds
): XYRatios {
    const scaling = calcNeedsScaling(viewportBBox, targetBBox);
    return calcPanToBBoxRatiosWithScaling(scaling, viewportBBox, zoomRectBBox, ratios, targetBBox);
}

function calcPanToBBoxRatiosScaleProportionally(
    viewportBBox: BoxBounds,
    zoomRectBBox: BoxBounds,
    ratios: Partial<XYRatios>,
    targetBBox: BoxBounds
): XYRatios {
    const scaleRequirements = calcNeedsScaling(viewportBBox, targetBBox);
    if (!scaleRequirements.x && !scaleRequirements.y) {
        return calcPanToBBoxRatiosWithScaling(scaleRequirements, viewportBBox, zoomRectBBox, ratios, targetBBox);
    }

    // Compute required uniform scale
    const scaleX = targetBBox.width / viewportBBox.width;
    const scaleY = targetBBox.height / viewportBBox.height;
    const scale = Math.max(scaleX, scaleY);

    // Expand viewport proportionally around target center:
    const target = Vec4.from(targetBBox);
    const cx = (target.x1 + target.x2) / 2;
    const cy = (target.y1 + target.y2) / 2;

    // Scale the viewport:
    const newWidth = viewportBBox.width * scale;
    const newHeight = viewportBBox.height * scale;
    const scaledViewportBBox: BoxBounds = {
        x: cx - newWidth / 2,
        y: cy - newHeight / 2,
        width: newWidth,
        height: newHeight,
    };

    return calcPanToBBoxRatiosWithScaling(
        { x: false, y: false },
        scaledViewportBBox,
        scaledViewportBBox,
        ratios,
        targetBBox
    );
}
