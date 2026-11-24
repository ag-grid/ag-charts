import { angleBetween, isBetweenAngles, normalizeAngle180, normalizeAngle360 } from '../../geometry/angle';
import { type BoxBounds } from '../../geometry/boxBounds';
import { BBox } from '../bbox';
import { boxCrossesSegment, segmentIntersection } from '../intersection';

export interface SectorBoundaries {
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    /** How far, in pixels, the drawn straight edges sit inside the edges at `startAngle` and `endAngle`. */
    radialEdgeInset?: number;
}

/** Whether a sector sweeps the whole circle, so its two straight edges meet each other rather than a neighbour. */
export function isFullSweep(startAngle: number, endAngle: number) {
    return Math.abs(endAngle - startAngle) >= 2 * Math.PI - 1e-6;
}

/**
 * How far a sector edge sits inside its geometric edge: half the stroke, so the stroke paints inside the shape,
 * plus half the gap where the edge faces a neighbouring shape.
 */
export function sectorEdgeInset(gap: number, strokeInset: number, facesNeighbour: boolean) {
    return Math.max(strokeInset + (facesNeighbour ? gap / 2 : 0), 0);
}

/**
 * The angle from a sector's straight edge to the point at `radius` that lies `distance` from that edge, measured
 * square to it; a right angle where nothing at that radius is so far from the edge.
 */
export function edgeOffsetAngle(radius: number, distance: number) {
    if (radius <= 0 || distance <= 0) return 0;
    return distance < radius ? Math.asin(distance / radius) : Math.PI / 2;
}

/** The chord between a sector's two straight edges, each moved in by `inset`, at `radius`; zero where they do not reach it. */
export function insetChord(radius: number, sweep: number, inset: number) {
    if (radius <= 0 || radius <= inset) return 0;
    const span = sweep - 2 * edgeOffsetAngle(radius, inset);
    return span > 0 ? 2 * radius * Math.sin(span / 2) : 0;
}

export interface SectorCornerRadii {
    startOuter: number;
    endOuter: number;
    startInner: number;
    endInner: number;
}

/**
 * Shrinks a sector's corner radii, in place, to what its straight edges leave room for once each is moved in by
 * `inset`. `innerCorners` is false where those edges never reach the inner arc, which then has no corners.
 */
export function clampSectorCornerRadii(
    corners: SectorCornerRadii,
    sweep: number,
    innerRadius: number,
    outerRadius: number,
    inset: number,
    innerCorners: boolean
) {
    const radialLength = outerRadius - innerRadius;
    const outerLimit = Math.min(insetChord(outerRadius, sweep, inset), radialLength, outerRadius - inset) / 2;
    const innerLimit = innerCorners ? Math.min(insetChord(innerRadius, sweep, inset), radialLength) / 2 : 0;
    let startOuter = Math.floor(Math.max(0, Math.min(corners.startOuter, outerLimit)));
    let endOuter = Math.floor(Math.max(0, Math.min(corners.endOuter, outerLimit)));
    let startInner = Math.floor(Math.max(0, Math.min(corners.startInner, innerLimit)));
    let endInner = Math.floor(Math.max(0, Math.min(corners.endInner, innerLimit)));

    const outerScale = radiiScalingFactor(outerRadius, sweep, -startOuter, -endOuter, inset);
    startOuter *= outerScale;
    endOuter *= outerScale;
    const innerScale = radiiScalingFactor(innerRadius, sweep, startInner, endInner, inset);
    startInner *= innerScale;
    endInner *= innerScale;

    const longestEdge = Math.max(startOuter + startInner, endOuter + endInner);
    const edgeScale = longestEdge > 0 ? Math.min(radialLength / longestEdge, 1) : 1;
    corners.startOuter = startOuter * edgeScale;
    corners.endOuter = endOuter * edgeScale;
    corners.startInner = startInner * edgeScale;
    corners.endInner = endInner * edgeScale;
}

export function sectorBox({ startAngle, endAngle, innerRadius, outerRadius }: SectorBoundaries) {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;

    const addPoint = (x: number, y: number) => {
        x0 = Math.min(x, x0);
        y0 = Math.min(y, y0);
        x1 = Math.max(x, x1);
        y1 = Math.max(y, y1);
    };

    addPoint(innerRadius * Math.cos(startAngle), innerRadius * Math.sin(startAngle));
    addPoint(innerRadius * Math.cos(endAngle), innerRadius * Math.sin(endAngle));
    addPoint(outerRadius * Math.cos(startAngle), outerRadius * Math.sin(startAngle));
    addPoint(outerRadius * Math.cos(endAngle), outerRadius * Math.sin(endAngle));

    if (isBetweenAngles(0, startAngle, endAngle)) {
        addPoint(outerRadius, 0);
    }
    if (isBetweenAngles(Math.PI * 0.5, startAngle, endAngle)) {
        addPoint(0, outerRadius);
    }
    if (isBetweenAngles(Math.PI, startAngle, endAngle)) {
        addPoint(-outerRadius, 0);
    }
    if (isBetweenAngles(Math.PI * 1.5, startAngle, endAngle)) {
        addPoint(0, -outerRadius);
    }

    return new BBox(x0, y0, x1 - x0, y1 - y0);
}

/** True when the sector holds each of a label's line boxes: the one test a drawn sector label must pass to show. */
export function areLineBoxesInSector(boxes: readonly BoxBounds[], sector: SectorBoundaries) {
    for (const box of boxes) {
        if (!isBoxInSector(box, sector)) return false;
    }
    return true;
}

/**
 * True when the whole of `box` lies inside the sector. The outer radius is settled by the corners, and so
 * is the angular range while the sector holds no more than half a turn; the hole and a reflex sector's
 * excluded wedge are not, since a box reaching across the centre line comes closest to the origin at the
 * middle of an edge, and one straddling the wedge can keep every corner inside the range.
 */
export function isBoxInSector(box: BoxBounds, sector: SectorBoundaries) {
    const x1 = box.x + box.width;
    const y1 = box.y + box.height;
    const { startAngle, endAngle } = sector;
    if (startAngle === endAngle) return false;
    const minRadius = Math.min(sector.innerRadius, sector.outerRadius);
    const maxRadius = Math.max(sector.innerRadius, sector.outerRadius);
    if (
        !isWithinRadii(box.x, box.y, minRadius, maxRadius) ||
        !isWithinRadii(x1, box.y, minRadius, maxRadius) ||
        !isWithinRadii(x1, y1, minRadius, maxRadius) ||
        !isWithinRadii(box.x, y1, minRadius, maxRadius)
    ) {
        return false;
    }
    const start180 = normalizeAngle180(startAngle);
    const end180 = normalizeAngle180(endAngle);
    const inset = sector.radialEdgeInset ?? 0;
    const startCos = Math.cos(startAngle);
    const startSin = Math.sin(startAngle);
    const endCos = Math.cos(endAngle);
    const endSin = Math.sin(endAngle);
    if (
        !isWithinAngles(box.x, box.y, start180, end180, inset, startCos, startSin, endCos, endSin) ||
        !isWithinAngles(x1, box.y, start180, end180, inset, startCos, startSin, endCos, endSin) ||
        !isWithinAngles(x1, y1, start180, end180, inset, startCos, startSin, endCos, endSin) ||
        !isWithinAngles(box.x, y1, start180, end180, inset, startCos, startSin, endCos, endSin)
    ) {
        return false;
    }
    const nearestX = Math.min(Math.max(0, box.x), x1);
    const nearestY = Math.min(Math.max(0, box.y), y1);
    if (nearestX ** 2 + nearestY ** 2 < minRadius ** 2) return false;
    // Nor is the angular range settled by the corners once the sector is wider than half a turn: the wedge
    // it excludes can pass between them, so the box has to be clear of both boundary edges as well.
    if (angleBetween(startAngle, endAngle) <= Math.PI) return true;
    return !edgeCrossesBox(box, startAngle, maxRadius) && !edgeCrossesBox(box, endAngle, maxRadius);
}

/** True when the sector edge at `angle`, from the centre out to `radius`, crosses `box`. */
function edgeCrossesBox(box: BoxBounds, angle: number, radius: number) {
    return boxCrossesSegment(box, 0, 0, radius * Math.cos(angle), radius * Math.sin(angle));
}

export function isPointInSector(x: number, y: number, sector: SectorBoundaries) {
    const { startAngle, endAngle, innerRadius, outerRadius } = sector;
    if (startAngle === endAngle) return false;
    if (!isWithinRadii(x, y, Math.min(innerRadius, outerRadius), Math.max(innerRadius, outerRadius))) return false;
    const inAngle = isWithinAngleRange(Math.atan2(y, x), normalizeAngle180(startAngle), normalizeAngle180(endAngle));
    const inset = sector.radialEdgeInset ?? 0;
    if (!inAngle || inset <= 0) return inAngle;
    return (
        isClearOfEdge(x, y, Math.cos(startAngle), Math.sin(startAngle), inset, 1) &&
        isClearOfEdge(x, y, Math.cos(endAngle), Math.sin(endAngle), inset, -1)
    );
}

const enum PointTestMode {
    Empty,
    Exact,
    Fast,
}

/** {@link isPointInSector} resolved once per sector, which also bounds where along a ray its answer is known. */
export class SectorPointTester {
    private mode = PointTestMode.Empty;
    private minRadius = 0;
    private maxRadius = 0;
    private start180 = 0;
    private end180 = 0;
    private inset = 0;
    private startCos = 0;
    private startSin = 0;
    private endCos = 0;
    private endSin = 0;
    private anyAngle = false;
    private wide = false;
    /** Whether a point between two that {@link insideUntil} vouches for is vouched for too: no hole, inset or reflex turn. */
    convex = false;
    private innerOut = 0;
    private innerIn = 0;
    private outerIn = 0;
    private outerOut = 0;

    reset(sector: SectorBoundaries): this {
        const { startAngle, endAngle, innerRadius, outerRadius } = sector;
        this.minRadius = Math.min(innerRadius, outerRadius);
        this.maxRadius = Math.max(innerRadius, outerRadius);
        this.start180 = normalizeAngle180(startAngle);
        this.end180 = normalizeAngle180(endAngle);
        this.inset = sector.radialEdgeInset ?? 0;
        this.startCos = Math.cos(startAngle);
        this.startSin = Math.sin(startAngle);
        this.endCos = Math.cos(endAngle);
        this.endSin = Math.sin(endAngle);
        // The sweep as isWithinAngleRange reads it: equal ends hold every angle.
        const sweep =
            this.start180 < this.end180 ? this.end180 - this.start180 : this.end180 - this.start180 + 2 * Math.PI;
        this.anyAngle = this.start180 === this.end180;
        this.wide = sweep > Math.PI;
        this.innerOut = (this.minRadius * (1 - POINT_TEST_MARGIN)) ** 2;
        this.innerIn = (this.minRadius * (1 + POINT_TEST_MARGIN)) ** 2;
        this.outerIn = (this.maxRadius * (1 - POINT_TEST_MARGIN)) ** 2;
        this.outerOut = (this.maxRadius * (1 + POINT_TEST_MARGIN)) ** 2;
        this.convex = this.minRadius === 0 && this.maxRadius > 0 && this.inset <= 0 && !this.anyAngle && !this.wide;
        if (startAngle === endAngle) {
            this.mode = PointTestMode.Empty;
        } else if (this.minRadius < 0) {
            // Squared radii only order non-negative bounds.
            this.mode = PointTestMode.Exact;
        } else {
            this.mode = PointTestMode.Fast;
        }
        return this;
    }

    readonly contains = (x: number, y: number): boolean => {
        if (this.mode !== PointTestMode.Fast) return this.mode === PointTestMode.Exact && this.exact(x, y);
        // OPTIMIZATION: fitting probes thousands of points per label; one clear of every boundary skips sqrt and atan2.
        const squared = x * x + y * y;
        if (squared > this.outerOut || squared < this.innerOut) return false;
        if (squared < this.innerIn || squared > this.outerIn) return this.exact(x, y);
        const { startCos, startSin, endCos, endSin, inset } = this;
        // Signed distances from the start and end edge lines, positive on the sector's side.
        const pastStart = y * startCos - x * startSin;
        const beforeEnd = x * endSin - y * endCos;
        if (!this.anyAngle) {
            const margin = POINT_TEST_MARGIN * (Math.abs(x) + Math.abs(y));
            if (Math.abs(pastStart) <= margin || Math.abs(beforeEnd) <= margin) return this.exact(x, y);
            const inAngle = this.wide ? pastStart > 0 || beforeEnd > 0 : pastStart > 0 && beforeEnd > 0;
            if (!inAngle) return false;
        }
        if (inset <= 0) return true;
        // isClearOfEdge for both edges, whose distances across are pastStart and beforeEnd.
        if (!(x * startCos + y * startSin < 0 || pastStart < 0 || pastStart >= inset)) return false;
        return x * endCos + y * endSin < 0 || beforeEnd < 0 || beforeEnd >= inset;
    };

    /** How far along `(dx, dy)` from `(px, py)` every point passes {@link contains} by a margin, else -1. */
    readonly insideUntil = (px: number, py: number, dx: number, dy: number, limit: number): number => {
        if (this.mode !== PointTestMode.Fast || this.anyAngle || this.wide) return -1;
        const margin = RAY_TEST_MARGIN * (Math.abs(px) + Math.abs(py) + limit * (Math.abs(dx) + Math.abs(dy)));
        const a = dx * dx + dy * dy;
        const b = 2 * (px * dx + py * dy);
        const c = px * px + py * py;
        const outer = this.maxRadius * this.maxRadius * (1 - RAY_TEST_MARGIN);
        const inner = this.minRadius > 0 ? this.minRadius * this.minRadius * (1 + RAY_TEST_MARGIN) : 0;
        if (!(margin > 0 && margin < Infinity && this.maxRadius > 0 && a > 0 && c <= outer && c >= inner)) return -1;
        let until = largerRoot(a, b, c - outer);
        if (this.minRadius > 0) until = Math.min(until, firstPositiveRoot(a, b, c - inner));
        const { startCos, startSin, endCos, endSin, inset } = this;
        const pastStart0 = py * startCos - px * startSin;
        const pastStart1 = dy * startCos - dx * startSin;
        const beforeEnd0 = px * endSin - py * endCos;
        const beforeEnd1 = dx * endSin - dy * endCos;
        until = Math.min(
            until,
            linearUntil(pastStart0, pastStart1, margin),
            linearUntil(beforeEnd0, beforeEnd1, margin)
        );
        if (inset > 0) {
            const startDot0 = px * startCos + py * startSin;
            const startDot1 = dx * startCos + dy * startSin;
            const endDot0 = px * endCos + py * endSin;
            const endDot1 = dx * endCos + dy * endSin;
            until = Math.min(
                until,
                eitherUntil(-startDot0, -startDot1, pastStart0 - inset, pastStart1, margin),
                eitherUntil(-endDot0, -endDot1, beforeEnd0 - inset, beforeEnd1, margin)
            );
        }
        return until >= 0 ? until : -1;
    };

    /** From where along `(dx, dy)` every point fails {@link contains} for good, past the rim or an edge; else Infinity. */
    readonly outsideFrom = (px: number, py: number, dx: number, dy: number, limit: number): number => {
        if (this.mode !== PointTestMode.Fast) return Infinity;
        const margin = RAY_TEST_MARGIN * (Math.abs(px) + Math.abs(py) + limit * (Math.abs(dx) + Math.abs(dy)));
        const a = dx * dx + dy * dy;
        if (!(margin > 0 && margin < Infinity && this.maxRadius > 0 && a > 0)) return Infinity;
        const c = px * px + py * py - this.maxRadius * this.maxRadius * (1 + RAY_TEST_MARGIN);
        const b = 2 * (px * dx + py * dy);
        const from = b * b - 4 * a * c < 0 ? 0 : Math.max(0, largerRoot(a, b, c));
        const { startCos, startSin, endCos, endSin } = this;
        const result =
            this.anyAngle || this.wide
                ? from
                : Math.min(
                      from,
                      linearFrom(py * startCos - px * startSin, dy * startCos - dx * startSin, margin),
                      linearFrom(px * endSin - py * endCos, dx * endSin - dy * endCos, margin)
                  );
        // A NaN bound would read as outside everywhere, so it vouches for nothing.
        return result >= 0 ? result : Infinity;
    };

    /**
     * True only when the point is outside the radii, or the angular range up to a half turn, by more than rounding at
     * `scale` can close; a box holding it then fails {@link isBoxInSector}, as one of its corners is as far out.
     */
    isClear(x: number, y: number, scale: number): boolean {
        const { minRadius, maxRadius } = this;
        const slack = CLEAR_MARGIN * (scale + Math.abs(minRadius) + Math.abs(maxRadius));
        const radius = Math.sqrt(x * x + y * y);
        if (radius > maxRadius + slack) return true;
        if (radius < minRadius - slack) return true;
        if (this.anyAngle || this.wide) return false;
        if (y * this.startCos - x * this.startSin < -slack) return true;
        return x * this.endSin - y * this.endCos < -slack;
    }

    private exact(x: number, y: number) {
        return (
            isWithinRadii(x, y, this.minRadius, this.maxRadius) &&
            isWithinAngles(
                x,
                y,
                this.start180,
                this.end180,
                this.inset,
                this.startCos,
                this.startSin,
                this.endCos,
                this.endSin
            )
        );
    }
}

// Relative margin a ray keeps from every boundary; 100x the point test's own, and ~1e8 times rounding.
const RAY_TEST_MARGIN = 1e-7;

/** The larger root of `a t^2 + b t + c` for `a > 0` and real roots; never negative when `c <= 0`. */
function largerRoot(a: number, b: number, c: number) {
    const q = -(b + (b < 0 ? -1 : 1) * Math.sqrt(b * b - 4 * a * c)) / 2;
    return Math.max(q / a, q === 0 ? 0 : c / q);
}

/** The first `t > 0` at which `a t^2 + b t + c` (positive at 0, `a > 0`) falls to zero, or Infinity. */
function firstPositiveRoot(a: number, b: number, c: number) {
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0 || b >= 0) return Infinity;
    const q = -(b - Math.sqrt(discriminant)) / 2;
    return Math.min(q / a, c / q);
}

/** How long `v0 + v1 t` stays at least `margin`, given it starts there; -1 when it does not. */
function linearUntil(v0: number, v1: number, margin: number) {
    if (v0 >= margin) return v1 < 0 ? (margin - v0) / v1 : Infinity;
    return -1;
}

/** From where `v0 + v1 t` stays below `-margin` for good, or Infinity. */
function linearFrom(v0: number, v1: number, margin: number) {
    if (v1 < 0) return Math.max(0, (-margin - v0) / v1);
    return v0 < -margin && v1 === 0 ? 0 : Infinity;
}

/** How long at least one of `u0 + u1 t` and `v0 + v1 t` stays at least `margin`, from `t = 0`; -1 when neither starts there. */
function eitherUntil(u0: number, u1: number, v0: number, v1: number, margin: number) {
    const uUntil = linearUntil(u0, u1, margin);
    const vUntil = linearUntil(v0, v1, margin);
    let until = Math.max(uUntil, vUntil);
    if (until < 0) return -1;
    // The one that does not hold at 0 may take over before the other lapses, and a linear one then holds for good.
    if (
        (uUntil < 0 && u1 > 0 && (margin - u0) / u1 <= until) ||
        (vUntil < 0 && v1 > 0 && (margin - v0) / v1 <= until)
    ) {
        until = Infinity;
    }
    return until;
}

// Relative margin, against the coordinates in play, past which rounding (~1e-15 of them) cannot move a point back.
const CLEAR_MARGIN = 1e-7;

// Relative distance from a boundary inside which a point takes the exact test; float error is ~1e-15 of it.
const POINT_TEST_MARGIN = 1e-9;

/** A `holdsColumn` for {@link probedFitRegion}: up to a quarter turn the inset sector is convex but for its hole. */
export function sectorColumnTest(
    sector: SectorBoundaries
): ((x: number, top: number, bottom: number) => boolean) | undefined {
    const sweep = sector.endAngle - sector.startAngle;
    if (!(sweep > 0 && sweep <= Math.PI / 2)) return undefined;
    const minRadius = Math.min(sector.innerRadius, sector.outerRadius);
    if (minRadius <= 0) return () => true;
    const holeSquared = minRadius * minRadius;
    return (x, top, bottom) => {
        const nearestY = Math.min(Math.max(0, Math.min(top, bottom)), Math.max(top, bottom));
        return x * x + nearestY * nearestY > holeSquared;
    };
}

function isWithinRadii(x: number, y: number, minRadius: number, maxRadius: number) {
    const radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    return radius >= minRadius && radius <= maxRadius;
}

/** The angular half of {@link isPointInSector}, given the {@link normalizeAngle180} angles and edge directions. */
function isWithinAngles(
    x: number,
    y: number,
    start180: number,
    end180: number,
    inset: number,
    startCos: number,
    startSin: number,
    endCos: number,
    endSin: number
) {
    const inAngle = isWithinAngleRange(Math.atan2(y, x), start180, end180);
    if (!inAngle || inset <= 0) return inAngle;
    return isClearOfEdge(x, y, startCos, startSin, inset, 1) && isClearOfEdge(x, y, endCos, endSin, inset, -1);
}

function isWithinAngleRange(angle: number, start180: number, end180: number) {
    // Sector can cross axis start
    return start180 < end180
        ? angle <= end180 && angle >= start180
        : (angle <= end180 && angle >= -Math.PI) || (angle >= start180 && angle <= Math.PI);
}

/**
 * False when the point lies within `inset` of the straight edge in direction `(cos, sin)`, on the side `interior`
 * faces. Assumes the sector runs clockwise from its start edge (`interior` 1) to its end edge (`interior` -1).
 */
function isClearOfEdge(x: number, y: number, cos: number, sin: number, inset: number, interior: 1 | -1) {
    if (x * cos + y * sin < 0) return true;
    const across = interior * (y * cos - x * sin);
    return across < 0 || across >= inset;
}

/**
 * Returns intersection points of the arc and the line segment.
 * Takes in arc parameters and line segment start/end points.
 */
function arcIntersections(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    counterClockwise: boolean,
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number {
    if (Number.isNaN(cx) || Number.isNaN(cy)) {
        return 0;
    }
    if (counterClockwise) {
        [endAngle, startAngle] = [startAngle, endAngle];
    }

    // Intersection points of the line segment and the circle (cx, cy, r).
    const points: { x: number; y: number }[] = [];
    if (x1 === x2) {
        // Vertical segment: parametrising as y = k * x + y0 is impossible (infinite slope), so
        // solve (x1 - cx)^2 + (y - cy)^2 = r^2 for y directly.
        const dd = Math.pow(r, 2) - Math.pow(x1 - cx, 2);
        if (dd < 0) {
            return 0;
        }
        const root = Math.sqrt(dd);
        points.push({ x: x1, y: cy + root }, { x: x1, y: cy - root });
    } else {
        // Solving the quadratic equation:
        // 1. y = k * x + y0
        // 2. (x - cx)^2 + (y - cy)^2 = r^2
        const k = (y2 - y1) / (x2 - x1);
        const y0 = y1 - k * x1;

        const a = Math.pow(k, 2) + 1;
        const b = 2 * (k * (y0 - cy) - cx);
        const c = Math.pow(cx, 2) + Math.pow(y0 - cy, 2) - Math.pow(r, 2);
        const d = Math.pow(b, 2) - 4 * a * c;
        if (d < 0) {
            return 0;
        }

        const i1x = (-b + Math.sqrt(d)) / 2 / a;
        const i2x = (-b - Math.sqrt(d)) / 2 / a;
        points.push({ x: i1x, y: k * i1x + y0 }, { x: i2x, y: k * i2x + y0 });
    }

    let intersections = 0;
    for (const { x, y } of points) {
        const isInsideLine =
            x >= Math.min(x1, x2) && x <= Math.max(x1, x2) && y >= Math.min(y1, y2) && y <= Math.max(y1, y2);
        if (!isInsideLine) {
            continue;
        }

        const angle = Math.atan2(y - cy, x - cx);
        if (isBetweenAngles(angle, startAngle, endAngle)) {
            intersections++;
        }
    }

    return intersections;
}

/** The sector's two straight edges, as endpoint coordinates. Invariant while only the box moves. */
export interface SectorEdges {
    startX0: number;
    startY0: number;
    startX1: number;
    startY1: number;
    endX0: number;
    endY0: number;
    endX1: number;
    endY1: number;
}

export function sectorEdges({ startAngle, endAngle, innerRadius, outerRadius }: SectorBoundaries): SectorEdges {
    const sinStartAngle = Math.sin(startAngle);
    const cosStartAngle = Math.cos(startAngle);
    const sinEndAngle = Math.sin(endAngle);
    const cosEndAngle = Math.cos(endAngle);

    return {
        startX0: innerRadius * cosStartAngle,
        startY0: innerRadius * sinStartAngle,
        startX1: outerRadius * cosStartAngle,
        startY1: outerRadius * sinStartAngle,
        endX0: innerRadius * cosEndAngle,
        endY0: innerRadius * sinEndAngle,
        endX1: outerRadius * cosEndAngle,
        endY1: outerRadius * sinEndAngle,
    };
}

/**
 * Tests whether an axis-aligned `box` overlaps the filled area of a `sector` (annular wedge).
 *
 * Pre-condition: the sector is centred at the origin (0, 0). A `Sector.centerX` / `Sector.centerY`
 * offset is intentionally NOT applied here — the only callers pass origin-centred sectors, so the
 * centre is assumed to be (0, 0) to avoid redundant arithmetic. `box` must be supplied in the same
 * (sector-local) coordinate space.
 *
 * @returns `true` when `box` and the sector overlap; a shared edge or single touching point counts.
 */
export function boxOverlapsSector(box: BoxBounds, sector: SectorBoundaries, edges = sectorEdges(sector)): boolean {
    const { startAngle, endAngle, outerRadius, innerRadius } = sector;
    const { startX0, startY0, startX1, startY1, endX0, endY0, endX1, endY1 } = edges;
    const top = box.y;
    const bottom = box.y + box.height;
    const left = box.x;
    const right = box.x + box.width;

    // Check if any corner of `sector` is in `box`:
    const pointInBox = (x: number, y: number): boolean => x >= left && x <= right && y >= top && y <= bottom;
    if (
        pointInBox(startX0, startY0) ||
        pointInBox(startX1, startY1) ||
        pointInBox(endX0, endY0) ||
        pointInBox(endX1, endY1)
    ) {
        return true;
    }

    // Check if any corner of `box` is in `sector`:
    if (
        isPointInSector(left, top, sector) ||
        isPointInSector(right, top, sector) ||
        isPointInSector(left, bottom, sector) ||
        isPointInSector(right, bottom, sector)
    ) {
        return true;
    }
    // Check if the lines of `box` and the lines of `sector` cross-over:
    if (
        segmentIntersection(left, top, right, top, startX0, startY0, startX1, startY1) > 0 ||
        segmentIntersection(left, top, right, top, endX0, endY0, endX1, endY1) > 0 ||
        segmentIntersection(left, bottom, right, bottom, startX0, startY0, startX1, startY1) > 0 ||
        segmentIntersection(left, bottom, right, bottom, endX0, endY0, endX1, endY1) > 0 ||
        segmentIntersection(left, top, left, bottom, startX0, startY0, startX1, startY1) > 0 ||
        segmentIntersection(left, top, left, bottom, endX0, endY0, endX1, endY1) > 0 ||
        segmentIntersection(right, top, right, bottom, startX0, startY0, startX1, startY1) > 0 ||
        segmentIntersection(right, top, right, bottom, endX0, endY0, endX1, endY1) > 0
    ) {
        return true;
    }
    // Check if the lines of `box` and the arcs of `sector` cross over:
    if (
        arcIntersections(0, 0, outerRadius, startAngle, endAngle, false, left, top, right, top) > 0 ||
        arcIntersections(0, 0, outerRadius, startAngle, endAngle, false, left, bottom, right, bottom) > 0 ||
        arcIntersections(0, 0, outerRadius, startAngle, endAngle, false, left, top, left, bottom) > 0 ||
        arcIntersections(0, 0, outerRadius, startAngle, endAngle, false, right, top, right, bottom) > 0
    ) {
        return true;
    }
    if (innerRadius > 0) {
        if (
            arcIntersections(0, 0, innerRadius, startAngle, endAngle, false, left, top, right, top) > 0 ||
            arcIntersections(0, 0, innerRadius, startAngle, endAngle, false, left, bottom, right, bottom) > 0 ||
            arcIntersections(0, 0, innerRadius, startAngle, endAngle, false, left, top, left, bottom) > 0 ||
            arcIntersections(0, 0, innerRadius, startAngle, endAngle, false, right, top, right, bottom) > 0
        ) {
            return true;
        }
    }
    return false;
}

// https://ag-grid.atlassian.net/wiki/spaces/AG/pages/3090087939/Sector+Corner+Radii
// Interval bisection over [0, 1]; no analytic solution is known.
// Pass in negative values for outer radius, positive for inner. Each corner keeps `inset` clear of its straight edge.
export function radiiScalingFactor(r: number, sweep: number, a: number, b: number, inset = 0) {
    if (a === 0 && b === 0) return 0;

    const fs1 = edgeOffsetAngle(r + a, inset + Math.abs(a)) + edgeOffsetAngle(r + b, inset + Math.abs(b)) - sweep;
    if (fs1 < 0) return 1;

    let start = 0;
    let end = 1;
    for (let i = 0; i < 8; i += 1) {
        const s = (start + end) / 2;
        const fs =
            edgeOffsetAngle(r + s * a, inset + Math.abs(s * a)) +
            edgeOffsetAngle(r + s * b, inset + Math.abs(s * b)) -
            sweep;
        if (fs < 0) {
            start = s;
        } else {
            end = s;
        }
    }

    // Ensure we aren't returning scaling values that are too large
    return start;
}

const delta = 1e-6;
export function clockwiseAngle(angle: number, relativeToStartAngle: number) {
    if (angleBetween(angle, relativeToStartAngle) < delta) {
        // Handle floating point errors
        return relativeToStartAngle;
    } else {
        return normalizeAngle360(angle - relativeToStartAngle) + relativeToStartAngle;
    }
}

export function clockwiseSweep(startAngle: number, endAngle: number) {
    const fullPie = Math.abs(endAngle - startAngle) >= 2 * Math.PI - delta;
    return fullPie ? 2 * Math.PI : normalizeAngle360(endAngle - startAngle);
}

export function clockwiseAngles(startAngle: number, endAngle: number, relativeToStartAngle = 0) {
    const sweepAngle = clockwiseSweep(startAngle, endAngle);
    startAngle = clockwiseAngle(startAngle, relativeToStartAngle);
    endAngle = startAngle + sweepAngle;
    return { startAngle, endAngle };
}

export function arcRadialLineIntersectionAngle(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    clipAngle: number
) {
    // y = x tan a
    // (x - cx)^2 + (y - cy)^2 - r^2 = 0
    // x^2 - 2 x cx + cx ^2 + y^2 - 2 y cy + cy ^2 - r^2 = 0
    // x^2 (1 + tan^2 a) + x * -2 (cx + cy tan a) + (cx^2 + cy^2 - r^2)
    // OR
    // y^2 (1 + cot^2 a) + y * -2 (cy + cx cot a) + (cy^2 + cx^2 - r^2)
    const sinA = Math.sin(clipAngle);
    const cosA = Math.cos(clipAngle);
    const c = cx ** 2 + cy ** 2 - r ** 2;

    let p0x;
    let p0y;
    let p1x;
    let p1y;
    if (cosA > 0.5) {
        const tanA = sinA / cosA;
        const a = 1 + tanA ** 2;
        const b = -2 * (cx + cy * tanA);
        const d = b ** 2 - 4 * a * c;
        if (d < 0) return;

        const x0 = (-b + Math.sqrt(d)) / (2 * a);
        const x1 = (-b - Math.sqrt(d)) / (2 * a);

        p0x = x0;
        p0y = x0 * tanA;
        p1x = x1;
        p1y = x1 * tanA;
    } else {
        const cotA = cosA / sinA;
        const a = 1 + cotA ** 2;
        const b = -2 * (cy + cx * cotA);
        const d = b ** 2 - 4 * a * c;
        if (d < 0) return;

        const y0 = (-b + Math.sqrt(d)) / (2 * a);
        const y1 = (-b - Math.sqrt(d)) / (2 * a);

        p0x = y0 * cotA;
        p0y = y0;
        p1x = y1 * cotA;
        p1y = y1;
    }

    // We're checking the intersection on a whole line rather than just
    // a line segment starting at the origin going off to infinity.
    // We need to add a check that the intersection was on the correct side of the line
    const normalisedX = cosA;
    const normalisedY = sinA;
    const p0DotNormalized = p0x * normalisedX + p0y * normalisedY;
    const p1DotNormalized = p1x * normalisedX + p1y * normalisedY;

    const a0 = p0DotNormalized > 0 ? clockwiseAngle(Math.atan2(p0y - cy, p0x - cx), startAngle) : Number.NaN;
    const a1 = p1DotNormalized > 0 ? clockwiseAngle(Math.atan2(p1y - cy, p1x - cx), startAngle) : Number.NaN;

    if (a0 >= startAngle && a0 <= endAngle) {
        return a0;
    } else if (a1 >= startAngle && a1 <= endAngle) {
        return a1;
    }
}

export function arcCircleIntersectionAngle(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    circleR: number
) {
    const d = Math.hypot(cx, cy);

    const d1 = (d ** 2 - r ** 2 + circleR ** 2) / (2 * d);
    const d2 = d - d1;

    const theta = Math.atan2(cy, cx);
    const deltaTheta = Math.acos(-d2 / r);

    const a0 = clockwiseAngle(theta + deltaTheta, startAngle);
    const a1 = clockwiseAngle(theta - deltaTheta, startAngle);

    if (a0 >= startAngle && a0 <= endAngle) {
        return a0;
    } else if (a1 >= startAngle && a1 <= endAngle) {
        return a1;
    }
}
