import type { AgMarkerShape, AgMarkerShapeFn } from 'ag-charts-types';

import { isString } from '../data/typeGuards';
import { Color } from '../format/color';
import { isGradientFill, isImageFill, isPatternFill } from '../geometry/fill';
import { type MarkerCoverRect, type MarkerCoverage, applyStyledMarkerSize } from '../geometry/labelPlacement';
import type { ExtendedPath2D } from '../scene/extendedPath2D';
import { gridInsideRect, markerLabelRect, pointInPolygons } from './markerLabelRect';
import { getSharedMarkerPath } from './markerPathCache';
import { MARKER_SHAPE_GEOMETRY, markerSnapAllowance } from './markerShapes';

/** The only parts of a marker style the pick-inflation resolution reads. */
export type MarkerStrokePickStyle = { stroke?: unknown; strokeWidth?: number; strokeOpacity?: number };

/**
 * Half the width of the stroke this marker style actually draws, in local-space pixels: the amount a node's pick
 * region must grow by so that clicking or hovering the stroke counts as hitting the node. A style that draws no
 * stroke contributes nothing.
 */
export function markerStrokePickInflation(style: MarkerStrokePickStyle | undefined): number {
    if (style == null) return 0;
    const { stroke, strokeWidth = 0, strokeOpacity = 1 } = style;
    // Same predicate the renderer uses to decide whether to stroke at all (see `Shape.strokeIsDrawn`).
    const strokeIsDrawn = stroke != null && stroke !== 'none' && strokeWidth > 0 && strokeOpacity > 0;
    return strokeIsDrawn ? strokeWidth / 2 : 0;
}

/** The parts of a marker style that decide what it covers and how far it draws. */
export interface MarkerCoverageStyle {
    readonly shape?: AgMarkerShape;
    readonly fill?: unknown;
    readonly fillOpacity?: number;
    readonly opacity?: number;
    readonly stroke?: unknown;
    readonly strokeWidth?: number;
    readonly strokeOpacity?: number;
}

/** Tells whether a marker fill paints the whole marker. */
export interface MarkerFillPaint {
    isPainted(fill: unknown): boolean;
}

/** For a series whose every possible fill is already known to paint. */
export const EVERY_MARKER_FILL_PAINTED: MarkerFillPaint = { isPainted: () => true };

const MIN_MEMOISED_ENTRIES = 64;
// Canvas's default miter limit, which markers draw with: a join reaches at most this many half-strokes past the path.
const CANVAS_MITER_LIMIT = 10;
// How far, as a fraction of a custom path's larger side, its curves may stray from the polygon its cover is measured on.
const CUSTOM_PATH_TOLERANCE = 0.005;

/** A series' memo of recent results, which forgets those unused since it last outgrew the data. */
class RecentMemo<V> {
    private recent = new Map<string, V>();
    // What `recent` held before it last outgrew the data, so the entries still in use survive it uncomputed.
    private older = new Map<string, V>();

    /** Starts afresh once it holds more than `datumCount` labels can need, so the entries of rolled-off data go. */
    bound(datumCount: number): void {
        if (this.recent.size <= Math.max(2 * datumCount, MIN_MEMOISED_ENTRIES)) return;
        this.older = this.recent;
        this.recent = new Map();
    }

    get(key: string): V | undefined {
        let value = this.recent.get(key);
        if (value === undefined) {
            value = this.older.get(key);
            if (value !== undefined) this.recent.set(key, value);
        }
        return value;
    }

    set(key: string, value: V): void {
        this.recent.set(key, value);
    }
}

function parsePaintedColor(color: string): boolean {
    const trimmed = color.trim();
    return Color.validColorString(trimmed) && Color.fromString(trimmed).a > 0;
}

/** A series' memo of which fills paint, so a repeat solve parses no colour. */
export class MarkerFillMemo extends RecentMemo<boolean> implements MarkerFillPaint {
    everyPainted(fills: Iterable<unknown>): boolean {
        for (const fill of fills) {
            if (!this.isPainted(fill)) return false;
        }
        return true;
    }

    /** True where the fill the renderer draws paints every point of the marker with some alpha. */
    isPainted(fill: unknown): boolean {
        if (isGradientFill(fill)) return this.isPaintedGradient(fill.colorStops);
        if (isPatternFill(fill)) {
            const { width = 10, height = 10, scale = 1 } = fill;
            // A pattern too small to render fills with its `fill` instead; otherwise its tiles' background covers.
            if (Math.max(width, 1) * scale < 1 || Math.max(height, 1) * scale < 1) {
                return (fill.fillOpacity ?? 1) > 0 && this.isPaintedColor(fill.fill);
            }
            return (fill.backgroundFillOpacity ?? 1) > 0 && this.isPaintedColor(fill.backgroundFill);
        }
        if (isImageFill(fill)) {
            // The background is filled over the whole marker under the image.
            return (fill.backgroundFillOpacity ?? 1) > 0 && this.isPaintedColor(fill.backgroundFill ?? 'black');
        }
        return this.isPaintedColor(fill);
    }

    /** A stop without a colour takes the last one's, and a gradient with no colour at all paints black. */
    private isPaintedGradient(stops: readonly { color?: unknown }[] | undefined): boolean {
        for (const { color } of stops ?? []) {
            if (color != null && !this.isPaintedColor(color)) return false;
        }
        return true;
    }

    /** True when `color` parses with some alpha; canvas keeps its previous fill for an invalid one, so that is unknown. */
    private isPaintedColor(color: unknown): boolean {
        if (!isString(color)) return false;
        let painted = this.get(color);
        if (painted === undefined) {
            painted = parsePaintedColor(color);
            this.set(color, painted);
        }
        return painted;
    }
}

/** What a custom marker path covers and reaches about the marker centre. */
interface MarkerPathCoverage {
    /** Px radius of a circle the fill holds; `0` when the centre is unfilled. */
    readonly cover: number;
    /** A rectangle the fill holds, as fractions of the marker size. */
    readonly coverRect: MarkerCoverRect | undefined;
    /** Px radius holding the whole path. */
    readonly reach: number;
    /** Whether {@link cover} and {@link coverRect} were measured, which only an `inside` label needs. */
    readonly measuredCover: boolean;
}

const NOTHING_DRAWN: MarkerPathCoverage = { cover: 0, coverRect: undefined, reach: 0, measuredCover: true };

type BySize = Map<number, MarkerPathCoverage>;

/** A series' cache of what its custom marker paths cover, measured once per shape function and size at its pixel ratio. */
export class MarkerShapeCoverage {
    private recent = new Map<AgMarkerShapeFn, BySize>();
    // What `recent` held before it last outgrew the data, so the entries still in use survive it unmeasured.
    private older = new Map<AgMarkerShapeFn, BySize>();
    private entries = 0;
    private pixelRatio = Number.NaN;

    /** Starts afresh once it holds more than `datumCount` labels can need, so the entries of rolled-off data go. */
    bound(datumCount: number): void {
        if (this.entries <= Math.max(2 * datumCount, MIN_MEMOISED_ENTRIES)) return;
        this.older = this.recent;
        this.recent = new Map();
        this.entries = 0;
    }

    of(shape: AgMarkerShapeFn, size: number, pixelRatio: number, withCover: boolean): MarkerPathCoverage {
        if (pixelRatio !== this.pixelRatio) {
            this.pixelRatio = pixelRatio;
            this.recent = new Map();
            this.older = new Map();
            this.entries = 0;
        }
        let coverage = this.recent.get(shape)?.get(size);
        if (coverage === undefined) {
            coverage = this.older.get(shape)?.get(size);
            if (coverage !== undefined) this.remember(shape, size, coverage);
        }
        if (coverage === undefined || (withCover && !coverage.measuredCover)) {
            coverage = measureMarkerPath(getSharedMarkerPath(shape, size, pixelRatio), size, withCover);
            this.remember(shape, size, coverage);
        }
        return coverage;
    }

    private remember(shape: AgMarkerShapeFn, size: number, coverage: MarkerPathCoverage): void {
        let bySize = this.recent.get(shape);
        if (bySize == null) {
            bySize = new Map();
            this.recent.set(shape, bySize);
        }
        if (!bySize.has(size)) this.entries++;
        bySize.set(size, coverage);
    }
}

type Polygons = { x: number; y: number }[][];

/** Measures the drawn path, conceding the flatten tolerance; an edge touching the grid rectangle drops it. */
function measureMarkerPath(path: ExtendedPath2D, size: number, withCover: boolean): MarkerPathCoverage {
    const bbox = path.computeBBox();
    const extent = Math.max(bbox.width, bbox.height);
    if (extent <= 0 || !Number.isFinite(extent)) return NOTHING_DRAWN;
    const tolerance = extent * CUSTOM_PATH_TOLERANCE;
    const polygons = path.flatten(16, tolerance);

    let farthest = 0;
    for (const polygon of polygons) {
        for (const { x, y } of polygon) farthest = Math.max(farthest, Math.hypot(x, y));
    }
    const reach = farthest + tolerance;
    if (!withCover) return { cover: 0, coverRect: undefined, reach, measuredCover: false };

    const cover = pointInPolygons(0, 0, polygons) ? Math.max(0, nearestEdge(polygons) - tolerance) : 0;
    const rect = gridInsideRect(polygons, bbox);
    let coverRect: MarkerCoverRect | undefined;
    if (rect != null && rectClearOfEdges(polygons, rect) && pointInPolygons(rect.x0, rect.y0, polygons)) {
        const width = rect.x1 - rect.x0 - 2 * tolerance;
        const height = rect.y1 - rect.y0 - 2 * tolerance;
        if (width > 0 && height > 0) {
            coverRect = {
                width: width / size,
                height: height / size,
                cx: (rect.x0 + rect.x1) / 2 / size,
                cy: (rect.y0 + rect.y1) / 2 / size,
            };
        }
    }
    return { cover, coverRect, reach, measuredCover: true };
}

/** Distance from the origin to the nearest edge of `polygons`, each closed back to its start as fill closes it. */
function nearestEdge(polygons: Polygons): number {
    let nearest = Infinity;
    for (const polygon of polygons) {
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            nearest = Math.min(nearest, distanceToSegment(polygon[j], polygon[i]));
        }
    }
    return nearest;
}

function distanceToSegment(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared > 0 ? Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / lengthSquared)) : 0;
    return Math.hypot(a.x + t * dx, a.y + t * dy);
}

/** True when no edge of `polygons` touches the rectangle, so all of it shares the fill of any one of its points. */
function rectClearOfEdges(polygons: Polygons, rect: { x0: number; y0: number; x1: number; y1: number }): boolean {
    for (const polygon of polygons) {
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (segmentTouchesRect(polygon[j], polygon[i], rect)) return false;
        }
    }
    return true;
}

// Liang-Barsky: clips the segment to the closed rectangle and reports whether anything is left.
function segmentTouchesRect(
    a: { x: number; y: number },
    b: { x: number; y: number },
    { x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }
): boolean {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let t0 = 0;
    let t1 = 1;
    const sides = [
        [-dx, a.x - x0],
        [dx, x1 - a.x],
        [-dy, a.y - y0],
        [dy, y1 - a.y],
    ];
    for (const [p, q] of sides) {
        if (p === 0) {
            if (q < 0) return false;
            continue;
        }
        const t = q / p;
        if (p < 0) {
            t0 = Math.max(t0, t);
        } else {
            t1 = Math.min(t1, t);
        }
        if (t0 > t1) return false;
    }
    return true;
}

/**
 * What a marker drawn in `style` covers and how far it draws, as fractions of its size; `undefined` when unknown,
 * as for a custom shape, which need not scale with its size. `fillPainted` is decided by the series, which may
 * resolve the fill per datum, as a colour scale does.
 */
export function markerCoverageOf(
    style: MarkerCoverageStyle,
    castsShadow: boolean,
    fillPainted: boolean,
    pixelRatio: number
): MarkerCoverage | undefined {
    const { shape } = style;
    if (typeof shape !== 'string') return undefined;
    const geometry = MARKER_SHAPE_GEOMETRY[shape];
    const reach = castsShadow ? Infinity : geometry.circumR;
    const strokeReach = markerStrokePickInflation(style) * geometry.miter;
    const painted = fillPainted && (style.opacity ?? 1) > 0 && (style.fillOpacity ?? 1) > 0;
    const snap = markerSnapAllowance(shape, pixelRatio);
    if (!painted) return { cover: 0, reach, strokeReach, snap };
    return { cover: geometry.inR, coverRect: markerLabelRect(shape), reach, strokeReach, snap };
}

/** What a series settles once per solve to stamp each label's marker coverage. */
export interface StyledMarkerCoverageInputs {
    /** Whether the marker casts a shadow or glow with nothing highlighted. */
    readonly castsShadow: boolean;
    readonly fills: MarkerFillPaint;
    readonly shapes: MarkerShapeCoverage;
    /** The pixel ratio the markers are drawn at, which a custom shape may draw differently for. */
    readonly pixelRatio: number;
    /** Whether the series' labels may sit inside their markers, which alone reads what a marker covers. */
    readonly inside: boolean;
}

interface StyledMarkerCoverageDatum {
    markerCover?: number;
    markerCoverRect?: MarkerCoverRect;
    markerReach?: number;
    markerSnap?: number;
}

/**
 * Stamps what the marker drawn in a datum's own `style` covers and how far it draws, in pixels. Assigned even when
 * unknown, as label data is reused across updates; a style casting its own shadow or glow reaches anywhere.
 */
export function applyStyledMarkerCoverage(
    datum: StyledMarkerCoverageDatum,
    style: (MarkerCoverageStyle & { size?: number; shadow?: unknown; glow?: unknown }) | undefined,
    inputs: StyledMarkerCoverageInputs
): void {
    const shape = style?.shape;
    if (style == null || (typeof shape !== 'string' && typeof shape !== 'function')) {
        datum.markerCover = 0;
        datum.markerCoverRect = undefined;
        datum.markerReach = Infinity;
        datum.markerSnap = 0;
        return;
    }
    const size = style.size ?? 0;
    const painted = (style.opacity ?? 1) > 0 && (style.fillOpacity ?? 1) > 0 && inputs.fills.isPainted(style.fill);
    const casts = inputs.castsShadow || style.shadow != null || style.glow != null;
    const strokeReach = markerStrokePickInflation(style);
    if (typeof shape === 'function') {
        const path = size > 0 ? inputs.shapes.of(shape, size, inputs.pixelRatio, inputs.inside) : NOTHING_DRAWN;
        datum.markerSnap = 0;
        datum.markerCover = painted ? path.cover : 0;
        datum.markerCoverRect = painted ? path.coverRect : undefined;
        datum.markerReach = casts ? Infinity : path.reach + strokeReach * CANVAS_MITER_LIMIT;
        return;
    }
    const geometry = MARKER_SHAPE_GEOMETRY[shape];
    datum.markerSnap = markerSnapAllowance(shape, inputs.pixelRatio);
    datum.markerCover = painted ? geometry.inR * size : 0;
    datum.markerCoverRect = painted ? markerLabelRect(shape) : undefined;
    datum.markerReach = casts ? Infinity : geometry.circumR * size + strokeReach * geometry.miter;
}

type StampedMarkerStyle = MarkerCoverageStyle & { size?: number; shadow?: unknown; glow?: unknown };
type StampedLabelDatum = StyledMarkerCoverageDatum & { markerSize?: number };

/**
 * A series' stamping of each label's marker size and coverage from the style its marker is drawn in, for a series
 * whose markers differ per datum. Size and coverage come from the one style, so they always agree.
 */
export class LabelMarkerStamps {
    readonly fills = new MarkerFillMemo();
    private readonly shapes = new MarkerShapeCoverage();
    private stamped = false;

    stamp<D extends StampedLabelDatum>(
        labelData: readonly D[],
        styleOf: (datum: D) => StampedMarkerStyle | undefined,
        settled: Omit<StyledMarkerCoverageInputs, 'shapes'>
    ): void {
        const { fills, shapes } = this;
        fills.bound(labelData.length);
        shapes.bound(labelData.length);
        const inputs: StyledMarkerCoverageInputs = { ...settled, shapes };
        for (const datum of labelData) {
            const style = styleOf(datum);
            applyStyledMarkerSize(datum, style?.size);
            applyStyledMarkerCoverage(datum, style, inputs);
        }
        this.stamped = true;
    }

    /** Drops what an earlier solve stamped on label data that is reused, so the series' own coverage applies again. */
    unstamp(labelData: readonly StampedLabelDatum[]): void {
        if (!this.stamped) return;
        for (const datum of labelData) {
            datum.markerSize = undefined;
            datum.markerCover = undefined;
            datum.markerCoverRect = undefined;
            datum.markerReach = undefined;
            datum.markerSnap = undefined;
        }
        this.stamped = false;
    }
}
