import { type AgZoomAnchorPoint, _ModuleSupport } from 'ag-charts-community';
import { type BoxBounds, clamp, isNumberEqual } from 'ag-charts-core';

import type { DefinedZoomState } from './zoomTypes';

export const UNIT_MIN = 0;
export const UNIT_MAX = 1;
export const UNIT_SIZE = UNIT_MAX - UNIT_MIN;
export const DEFAULT_ANCHOR_POINT_X: AgZoomAnchorPoint = 'end';
export const DEFAULT_ANCHOR_POINT_Y: AgZoomAnchorPoint = 'middle';
export const ZOOM_VALID_CHECK_DEBOUNCE = 300;

const constrain = (value: number, min = UNIT_MIN, max = UNIT_MAX) => clamp(min, value, max);

export function unitZoomState(): DefinedZoomState {
    return { x: { min: UNIT_MIN, max: UNIT_MAX }, y: { min: UNIT_MIN, max: UNIT_MAX } };
}

export function dx(zoom: DefinedZoomState) {
    return zoom.x.max - zoom.x.min;
}

export function dy(zoom: DefinedZoomState) {
    return zoom.y.max - zoom.y.min;
}

function isZoomRangeEqual(left: _ModuleSupport.ZoomState, right: _ModuleSupport.ZoomState) {
    return isNumberEqual(left.min, right.min) && isNumberEqual(left.max, right.max);
}

export function isZoomEqual(left: DefinedZoomState, right: DefinedZoomState) {
    return isZoomRangeEqual(left.x, right.x) && isZoomRangeEqual(left.y, right.y);
}

export function isMaxZoom(zoom: DefinedZoomState) {
    return isZoomEqual(zoom, unitZoomState());
}

export function definedZoomState(zoom?: _ModuleSupport.AxisZoomState): DefinedZoomState {
    return {
        x: { min: zoom?.x?.min ?? UNIT_MIN, max: zoom?.x?.max ?? UNIT_MAX },
        y: { min: zoom?.y?.min ?? UNIT_MIN, max: zoom?.y?.max ?? UNIT_MAX },
    };
}

/**
 * Calculate the position on the series rect as a ratio from the top left corner. Invert the ratio on the y-axis to
 * cater for conflicting direction between screen and chart axis systems. Constrains the point to the series
 * rect so the zoom is pinned to the edges if the point is over the legends, axes, etc.
 */
export function pointToRatio(bbox: BoxBounds, x: number, y: number): { x: number; y: number } {
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
    const newDelta = newState.max - newState.min;
    const oldDelta = oldState.max - oldState.min;
    const scaledOrigin = origin * (1 - (oldDelta - newDelta));

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
    return {
        x: constrainAxis(zoom.x),
        y: constrainAxis(zoom.y),
    };
}

export function constrainAxis(axis: { min: number; max: number }) {
    const size = axis.max - axis.min;

    let min = axis.max > UNIT_MAX ? UNIT_MAX - size : axis.min;
    let max = axis.min < UNIT_MIN ? size : axis.max;

    min = Math.max(UNIT_MIN, min);
    max = Math.min(UNIT_MAX, max);

    return { min, max };
}

export function canResetZoom(zoomManager: _ModuleSupport.ZoomManager) {
    const current = zoomManager.getCoreZoom();
    const restore = zoomManager.getRestoredZoom();
    return _ModuleSupport.jsonDiff(current, restore) != null;
}
