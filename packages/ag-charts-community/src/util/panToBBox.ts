import { type Bounds4, type BoxBounds, Vec4, clamp } from 'ag-charts-core';

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
    target: Bounds4,
    ratioX: Ratios,
    ratioY: Ratios
): { x: number; y: number } {
    const world = calcWorldVec4(viewport, ratioX, ratioY);
    return {
        x: panAxisUnnormalized(world.x1, world.x2, viewport.x1, viewport.x2, target.x1, target.x2),
        y: panAxisUnnormalized(world.y1, world.y2, viewport.y1, viewport.y2, target.y1, target.y2),
    };
}

// The calculations of the new desired viewport (i.e. ZoomMinMax) is done in pixel coords (unnormalised).
// The desired (x, y) for the new viewport is found, the pixel coords are converted into normalized values
export function calcPanToBBoxRatios(
    scalingMode: PanToBBoxScalingModeEnum,
    viewportBBox: BoxBounds,
    ratios: Partial<XYRatios>,
    targetBBox: BoxBounds
): XYRatios {
    switch (scalingMode) {
        case PanToBBoxScalingModeEnum.None:
            return calcPanToBBoxRatiosNoScale(viewportBBox, ratios, targetBBox);

        case PanToBBoxScalingModeEnum.WhenViewportTooSmallScaleXYProportionally:
            return calcPanToBBoxRatiosScaleProportionally(viewportBBox, ratios, targetBBox);

        case PanToBBoxScalingModeEnum.WhenViewportTooSmallScaleXYDisproportionally:
            return calcPanToBBoxRatiosScaleDisproportionally(viewportBBox, ratios, targetBBox);

        default:
            return scalingMode satisfies never; // unreachable
    }
}

function calcPanToBBoxRatiosWithScaling(
    assignToViewport: NeedsScaling,
    viewportBBox: BoxBounds,
    ratios: Partial<XYRatios>,
    targetBBox: BoxBounds
): XYRatios {
    const { x: ratioX = { min: 0, max: 1 }, y: ratioY = { min: 0, max: 1 } } = ratios;

    const target = Vec4.from(targetBBox);
    const viewport = Vec4.from(viewportBBox);
    const pan = panAxesUnnormalized(viewport, target, ratioX, ratioY);

    const result: XYRatios = {
        x: assignToViewport.x
            ? {
                  min: normalize(viewport.x1, ratioX.min, viewport.x2, ratioX.max, viewport.x1),
                  max: normalize(viewport.x1, ratioX.min, viewport.x2, ratioX.max, viewport.x2),
              }
            : {
                  min: normalize(viewport.x1, ratioX.min, viewport.x2, ratioX.max, pan.x),
                  max: normalize(viewport.x1, ratioX.min, viewport.x2, ratioX.max, pan.x + viewportBBox.width),
              },
        y: assignToViewport.y
            ? {
                  min: normalize(viewport.y1, ratioY.min, viewport.y2, ratioY.max, viewport.y1),
                  max: normalize(viewport.y1, ratioY.min, viewport.y2, ratioY.max, viewport.y2),
              }
            : {
                  min: normalize(viewport.y1, ratioY.min, viewport.y2, ratioY.max, pan.y),
                  max: normalize(viewport.y1, ratioY.min, viewport.y2, ratioY.max, pan.y + viewportBBox.height),
              },
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
    ratios: Partial<XYRatios>,
    targetBBox: BoxBounds
): XYRatios {
    return calcPanToBBoxRatiosWithScaling({ x: false, y: false }, viewportBBox, ratios, targetBBox);
}

function calcPanToBBoxRatiosScaleDisproportionally(
    viewportBBox: BoxBounds,
    ratios: Partial<XYRatios>,
    targetBBox: BoxBounds
): XYRatios {
    const scaling = calcNeedsScaling(viewportBBox, targetBBox);
    return calcPanToBBoxRatiosWithScaling(scaling, viewportBBox, ratios, targetBBox);
}

function calcPanToBBoxRatiosScaleProportionally(
    viewportBBox: BoxBounds,
    ratios: Partial<XYRatios>,
    targetBBox: BoxBounds
): XYRatios {
    const scaleRequirements = calcNeedsScaling(viewportBBox, targetBBox);
    if (!scaleRequirements.x && !scaleRequirements.y) {
        return calcPanToBBoxRatiosWithScaling(scaleRequirements, viewportBBox, ratios, targetBBox);
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

    return calcPanToBBoxRatiosWithScaling({ x: false, y: false }, scaledViewportBBox, ratios, targetBBox);
}
