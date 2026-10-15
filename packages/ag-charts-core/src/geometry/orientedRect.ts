import type { BoxBounds } from './boxBounds';

/** A rectangle rotated about its centre: `cos`/`sin` give the direction of its width axis. */
export interface OrientedRect {
    cx: number;
    cy: number;
    halfWidth: number;
    halfHeight: number;
    cos: number;
    sin: number;
}

/** Writes the rectangle drawn at `rotationDeg` about its centre, with the unrotated size `width` × `height`. */
export function writeOrientedRect(
    out: OrientedRect,
    cx: number,
    cy: number,
    width: number,
    height: number,
    rotationDeg: number
): OrientedRect {
    const angle = (rotationDeg * Math.PI) / 180;
    out.cx = cx;
    out.cy = cy;
    out.halfWidth = width / 2;
    out.halfHeight = height / 2;
    out.cos = Math.cos(angle);
    out.sin = Math.sin(angle);
    return out;
}

/** How far `r` reaches from its centre along the unit axis `(ax, ay)`. */
function reachAlong(r: OrientedRect, ax: number, ay: number): number {
    return r.halfWidth * Math.abs(r.cos * ax + r.sin * ay) + r.halfHeight * Math.abs(r.cos * ay - r.sin * ax);
}

function separatedAlong(a: OrientedRect, b: OrientedRect, ax: number, ay: number): boolean {
    const distance = Math.abs((b.cx - a.cx) * ax + (b.cy - a.cy) * ay);
    return distance >= reachAlong(a, ax, ay) + reachAlong(b, ax, ay);
}

/** Whether two rotated rectangles share any area; rectangles that only touch do not. */
export function orientedRectsOverlap(a: OrientedRect, b: OrientedRect): boolean {
    return !(
        separatedAlong(a, b, a.cos, a.sin) ||
        separatedAlong(a, b, -a.sin, a.cos) ||
        separatedAlong(a, b, b.cos, b.sin) ||
        separatedAlong(a, b, -b.sin, b.cos)
    );
}

// OPTIMIZATION: scratch for an axis-aligned box tested as a rotated rectangle, keeping the test allocation-free.
const boxRect: OrientedRect = { cx: 0, cy: 0, halfWidth: 0, halfHeight: 0, cos: 1, sin: 0 };

export function orientedRectOverlapsBox(r: OrientedRect, box: BoxBounds): boolean {
    boxRect.halfWidth = box.width / 2;
    boxRect.halfHeight = box.height / 2;
    boxRect.cx = box.x + boxRect.halfWidth;
    boxRect.cy = box.y + boxRect.halfHeight;
    return orientedRectsOverlap(r, boxRect);
}

export function orientedRectOverlapsCircle(r: OrientedRect, cx: number, cy: number, radius: number): boolean {
    const dx = cx - r.cx;
    const dy = cy - r.cy;
    const along = r.cos * dx + r.sin * dy;
    const across = r.cos * dy - r.sin * dx;
    const nearestAlong = Math.max(-r.halfWidth, Math.min(r.halfWidth, along));
    const nearestAcross = Math.max(-r.halfHeight, Math.min(r.halfHeight, across));
    return (along - nearestAlong) ** 2 + (across - nearestAcross) ** 2 < radius * radius;
}
