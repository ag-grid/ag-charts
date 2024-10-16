import type { BBoxValues } from './bboxinterface';
import { clamp } from './number';
import { Vec4 } from './vector4';

type Ratios = { min: number; max: number };
type XYRatios = { x: Ratios; y: Ratios };

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

function calcWorldVec4(viewport: Vec4, ratioX: Ratios, ratioY: Ratios): Vec4 {
    const [x1, x2] = calcWorldAxis(viewport.x1, viewport.x2, ratioX);
    const [y1, y2] = calcWorldAxis(viewport.y1, viewport.y2, ratioY);
    return { x1, x2, y1, y2 };
}

/* Pan viewport min (unnormalised, i.e. pixel coords.) by the smallest amount
   such that the viewport range includes the input target range but clamped at
   the world range. The function assumes:
   1)  worldMin <= viewportMin <= viewportMax <= worldMax
   2)  (viewportMax - viewportMin) >= (targetMax - targetMin)
*/
function panAxesUnnormalized(
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

// The calculations of the new desired viewport (i.e. ZoomState) is done in pixel coords (unnormalised).
// The desired (x, y) for the new viewport is found, the pixel coords are converted into normalized values
export function calcPanToBBoxRatios(
    viewportBBox: BBoxValues,
    ratioX: Ratios,
    ratioY: Ratios,
    targetBBox: BBoxValues
): XYRatios {
    const target = Vec4.from(targetBBox);
    const viewport = Vec4.from(viewportBBox);
    const world = calcWorldVec4(viewport, ratioX, ratioY);

    const x = panAxesUnnormalized(world.x1, world.x2, viewport.x1, viewport.x2, target.x1, target.x2);
    const y = panAxesUnnormalized(world.y1, world.y2, viewport.y1, viewport.y2, target.y1, target.y2);

    return {
        x: {
            min: normalize(viewport.x1, ratioX.min, viewport.x2, ratioX.max, x),
            max: normalize(viewport.x1, ratioX.min, viewport.x2, ratioX.max, x + viewportBBox.width),
        },
        y: {
            min: normalize(viewport.y1, ratioY.min, viewport.y2, ratioY.max, y),
            max: normalize(viewport.y1, ratioY.min, viewport.y2, ratioY.max, y + viewportBBox.height),
        },
    };
}
