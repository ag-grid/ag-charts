import type { BBoxValues } from "./bboxinterface";
import { clamp } from "./number";

type Ratios = { min: number, max: number };
type XYRatios = { x: Ratios, y: Ratios };

function normalize(screenMin: number, min: number, screenMax: number, max: number, target: number): number {
    return min + (max - min) * ((target - screenMin) / (screenMax - screenMin));
}

function unnormalize(screenMin: number, min: number, screenMax: number, max: number, ratio: number): number {
    return screenMin + (ratio - min) * ((screenMax - screenMin) / (max - min));
}

function calcWorld(viewportMin: number, viewportMax: number, ratio: Ratios): [number, number] {
    return [
        unnormalize(viewportMin, ratio.min, viewportMax, ratio.max, 0),
        unnormalize(viewportMin, ratio.min, viewportMax, ratio.max, 1),
    ];
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
export function calcPanToBBoxRatios(viewport: BBoxValues, ratioX: Ratios, ratioY: Ratios, target: BBoxValues): XYRatios {
    const [targetXMin, targetXMax] = [target.x, target.x + target.width];
    const [targetYMin, targetYMax] = [target.y, target.y + target.height];
    const [viewportXMin, viewportXMax] = [viewport.x, viewport.x + viewport.width];
    const [viewportYMin, viewportYMax] = [viewport.y, viewport.y + viewport.height];
    const [worldXMin, worldXMax] = calcWorld(viewportXMin, viewportXMax, ratioX);
    const [worldYMin, worldYMax] = calcWorld(viewportYMin, viewportYMax, ratioY);

    const x = panAxesUnnormalized(worldXMin, worldXMax, viewportXMin, viewportXMax, targetXMin, targetXMax);
    const y = panAxesUnnormalized(worldYMin, worldYMax, viewportYMin, viewportYMax, targetYMin, targetYMax);

    return {
        x: {
            min: normalize(viewportXMin, ratioX.min, viewportXMax, ratioX.max, x),
            max: normalize(viewportXMin, ratioX.min, viewportXMax, ratioX.max, x + viewport.width),
        },
        y: {
            min: normalize(viewportYMin, ratioY.min, viewportYMax, ratioY.max, y),
            max: normalize(viewportYMin, ratioY.min, viewportYMax, ratioY.max, y + viewport.height),
        },
    };
}
