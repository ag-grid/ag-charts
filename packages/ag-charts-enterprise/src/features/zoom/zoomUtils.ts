import { AgZoomAnchorPoint, _ModuleSupport, _Scene } from 'ag-charts-community';

import type { DefinedZoomState } from './zoomTypes';

const { clamp } = _ModuleSupport;

export const UNIT = { min: 0, max: 1 };

const constrain = (value: number, min = UNIT.min, max = UNIT.max) => clamp(min, value, max);

export function unitZoomState(): DefinedZoomState {
    return { x: { ...UNIT }, y: { ...UNIT } };
}

export function dx(zoom: DefinedZoomState) {
    return zoom.x.max - zoom.x.min;
}

export function dy(zoom: DefinedZoomState) {
    return zoom.y.max - zoom.y.min;
}

export function definedZoomState(zoom?: _ModuleSupport.AxisZoomState): DefinedZoomState {
    return {
        x: { min: zoom?.x?.min ?? UNIT.min, max: zoom?.x?.max ?? UNIT.max },
        y: { min: zoom?.y?.min ?? UNIT.min, max: zoom?.y?.max ?? UNIT.max },
    };
}

/**
 * Calculate the position on the series rect as a ratio from the top left corner. Invert the ratio on the y-axis to
 * cater for conflicting direction between screen and chart axis systems. Constrains the point to the series
 * rect so the zoom is pinned to the edges if the point is over the legends, axes, etc.
 */
export function pointToRatio(bbox: _Scene.BBox, x: number, y: number): { x: number; y: number } {
    if (!bbox) return { x: 0, y: 0 };

    const constrainedX = constrain(x - bbox.x, 0, bbox.x + bbox.width);
    const constrainedY = constrain(y - bbox.y, 0, bbox.y + bbox.height);

    const rx = (1 / bbox.width) * constrainedX;
    const ry = 1 - (1 / bbox.height) * constrainedY;

    return { x: constrain(rx), y: constrain(ry) };
}

/**
 * Translate a zoom bounding box by shifting all points by the given x & y amounts.
 */
export function translateZoom(zoom: DefinedZoomState, x: number, y: number): DefinedZoomState {
    return {
        x: { min: zoom.x.min + x, max: zoom.x.max + x },
        y: { min: zoom.y.min + y, max: zoom.y.max + y },
    };
}

/**
 * Scale a zoom bounding box from the top left corner.
 */
export function scaleZoom(zoom: DefinedZoomState, sx: number, sy: number): DefinedZoomState {
    return {
        x: { min: zoom.x.min, max: zoom.x.min + dx(zoom) * sx },
        y: { min: zoom.y.min, max: zoom.y.min + dy(zoom) * sy },
    };
}

/**
 * Scale a zoom bounding box from the center.
 */
export function scaleZoomCenter(zoom: DefinedZoomState, sx: number, sy: number): DefinedZoomState {
    const dx_ = dx(zoom);
    const dy_ = dy(zoom);

    const cx = zoom.x.min + dx_ / 2;
    const cy = zoom.y.min + dy_ / 2;

    return {
        x: { min: cx - (dx_ * sx) / 2, max: cx + (dx_ * sx) / 2 },
        y: { min: cy - (dy_ * sy) / 2, max: cy + (dy_ * sy) / 2 },
    };
}

/**
 * Scale a single zoom axis about its anchor.
 */
export function scaleZoomAxisWithAnchor(
    newState: _ModuleSupport.ZoomState,
    oldState: _ModuleSupport.ZoomState,
    anchor: AgZoomAnchorPoint,
    origin?: number
): _ModuleSupport.ZoomState {
    const { min, max } = oldState;
    const center = min + (max - min) / 2;
    const diff = newState.max - newState.min;

    switch (anchor) {
        case 'start':
            return { min, max: oldState.min + diff };
        case 'end':
            return { min: oldState.max - diff, max };
        case 'middle':
            return { min: center - diff / 2, max: center + diff / 2 };
        case 'pointer':
            return scaleZoomAxisWithPoint(newState, oldState, origin ?? center);
        default:
            return { min, max };
    }
}

export function scaleZoomAxisWithPoint(
    newState: _ModuleSupport.ZoomState,
    oldState: _ModuleSupport.ZoomState,
    origin: number
) {
    const scaledOrigin = origin * (1 - (oldState.max - oldState.min - (newState.max - newState.min)));

    const translation = origin - scaledOrigin;
    const min = newState.min + translation;
    const max = newState.max + translation;

    return { min, max };
}

export function multiplyZoom(zoom: DefinedZoomState, nx: number, ny: number) {
    return {
        x: { min: zoom.x.min * nx, max: zoom.x.max * nx },
        y: { min: zoom.y.min * ny, max: zoom.y.max * ny },
    };
}

/**
 * Constrain a zoom bounding box such that no corner exceeds an edge while maintaining the same width and height.
 */
export function constrainZoom(zoom: DefinedZoomState): DefinedZoomState {
    const after = unitZoomState();

    after.x = constrainAxis(zoom.x);
    after.y = constrainAxis(zoom.y);

    return after;
}

function constrainAxis(axis: { min: number; max: number }) {
    const size = axis.max - axis.min;

    let min = axis.max > UNIT.max ? UNIT.max - size : axis.min;
    let max = axis.min < UNIT.min ? size : axis.max;

    min = Math.max(UNIT.min, min);
    max = Math.min(UNIT.max, max);

    return { min, max };
}

export function constrainAxisWithOld(
    { min, max }: { min: number; max: number },
    old: { min: number; max: number },
    minRatio: number
) {
    if (max === old.max) {
        min = max - minRatio;
    } else if (min === old.min) {
        max = min + minRatio;
    } else {
        const cx = old.min + (old.max - old.min) / 2;
        min = cx - minRatio / 2;
        max = cx + minRatio / 2;
    }

    return { min, max };
}
