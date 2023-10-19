import type { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { AnchorPoint, DefinedZoomState } from './zoomTypes';

export const UNIT = { min: 0, max: 1 };

export function unitZoomState(): DefinedZoomState {
    return { x: { ...UNIT }, y: { ...UNIT } };
}

const constrain = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

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
    const dx = zoom.x.max - zoom.x.min;
    const dy = zoom.y.max - zoom.y.min;

    return {
        x: { min: zoom.x.min, max: zoom.x.min + dx * sx },
        y: { min: zoom.y.min, max: zoom.y.min + dy * sy },
    };
}

/**
 * Scale a zoom bounding box from the center.
 */
export function scaleZoomCenter(zoom: DefinedZoomState, sx: number, sy: number): DefinedZoomState {
    const dx = zoom.x.max - zoom.x.min;
    const dy = zoom.y.max - zoom.y.min;

    const cx = zoom.x.min + dx / 2;
    const cy = zoom.y.min + dy / 2;

    return {
        x: { min: cx - (dx * sx) / 2, max: cx + (dx * sx) / 2 },
        y: { min: cy - (dy * sy) / 2, max: cy + (dy * sy) / 2 },
    };
}

/**
 * Scale a single zoom axis about its anchor, ignoring `pointer` anchors.
 */
export function scaleZoomAxisWithAnchor(
    newState: _ModuleSupport.ZoomState,
    oldState: _ModuleSupport.ZoomState,
    anchor: AgZoomAnchorPoint
): _ModuleSupport.ZoomState {
    let { min, max } = oldState;
    const center = (UNIT.max - UNIT.min) / 2;
    const diff = newState.max - newState.min;

    if (anchor === 'start') {
        max = oldState.min + diff;
    } else if (anchor === 'middle') {
        min = center - diff / 2;
        max = center + diff / 2;
    } else if (anchor === 'end') {
        min = oldState.max - diff;
    }

    return { min, max };
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
