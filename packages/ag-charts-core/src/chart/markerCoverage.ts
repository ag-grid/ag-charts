import type { AgMarkerShape, AgMarkerShapeFn } from 'ag-charts-types';

import { isString } from '../data/typeGuards';
import { Color } from '../format/color';
import { isGradientFill, isImageFill, isPatternFill } from '../geometry/fill';
import {
    type MarkerCoverRect,
    type MarkerCoverRectResolver,
    type MarkerCoverage,
    type MarkerOutlineResolver,
    applyStyledMarkerSize,
} from '../geometry/labelPlacement';
import { type MarkerOutline, outlineWorstMiter, segmentTouchesBox } from '../geometry/markerOutline';
import type { ExtendedPath2D } from '../scene/extendedPath2D';
import type { Point } from '../types/scene';
import { gridInsideRect, markerLabelRect, pointInPolygons } from './markerLabelRect';
import { getSharedMarkerPath } from './markerPathCache';
import { MARKER_SHAPE_GEOMETRY, markerShapeAnchor, markerSnapAllowance } from './markerShapes';

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
    /** Px radius holding the whole path. */
    readonly reach: number;
    /** Half-strokes a join of the path reaches past it at its sharpest corner. */
    readonly miter: number;
    /** Whether {@link cover} was measured, which only an `inside` label needs. */
    readonly measuredCover: boolean;
    /** A rectangle the fill holds, as fractions of the marker size, once {@link measuredRect}. */
    coverRect: MarkerCoverRect | undefined;
    measuredRect: boolean;
    /** The path's outline in px, once {@link measuredOutline}. */
    outline: MarkerOutline | undefined;
    measuredOutline: boolean;
}

const NOTHING_DRAWN: MarkerPathCoverage = {
    cover: 0,
    reach: 0,
    miter: 1,
    measuredCover: true,
    coverRect: undefined,
    measuredRect: true,
    outline: undefined,
    measuredOutline: true,
};

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
            coverage = measureMarkerPath(getSharedMarkerPath(shape, size, pixelRatio), withCover);
            this.remember(shape, size, coverage);
        }
        return coverage;
    }

    /** The rectangle the fill of `shape` holds at `size`, measured only the first time one is asked for. */
    coverRectOf(shape: AgMarkerShapeFn, size: number, pixelRatio: number): MarkerCoverRect | undefined {
        if (size <= 0) return undefined;
        const coverage = this.of(shape, size, pixelRatio, false);
        if (!coverage.measuredRect) {
            coverage.coverRect = measureMarkerCoverRect(getSharedMarkerPath(shape, size, pixelRatio), size);
            coverage.measuredRect = true;
        }
        return coverage.coverRect;
    }

    /** The outline of `shape` at `size`, flattened only the first time one is asked for. */
    outlineOf(shape: AgMarkerShapeFn, size: number, pixelRatio: number): MarkerOutline | undefined {
        if (size <= 0) return undefined;
        const coverage = this.of(shape, size, pixelRatio, false);
        if (!coverage.measuredOutline) {
            const flattened = flattenMarkerPath(getSharedMarkerPath(shape, size, pixelRatio));
            coverage.outline =
                flattened == null
                    ? undefined
                    : { polygons: flattened.polygons, unit: false, tolerance: flattened.tolerance };
            coverage.measuredOutline = true;
        }
        return coverage.outline;
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

/** The drawn path as polygons within `tolerance` of it, which every measure concedes; none when nothing is drawn. */
function flattenMarkerPath(path: ExtendedPath2D) {
    const bbox = path.computeBBox();
    const extent = Math.max(bbox.width, bbox.height);
    if (extent <= 0 || !Number.isFinite(extent)) return undefined;
    const tolerance = extent * CUSTOM_PATH_TOLERANCE;
    return { bbox, tolerance, polygons: path.flatten(16, tolerance) };
}

function measureMarkerPath(path: ExtendedPath2D, withCover: boolean): MarkerPathCoverage {
    const flattened = flattenMarkerPath(path);
    if (flattened == null) return NOTHING_DRAWN;
    const { tolerance, polygons } = flattened;
    let farthest = 0;
    for (const polygon of polygons) {
        for (const { x, y } of polygon) farthest = Math.max(farthest, Math.hypot(x, y));
    }
    const reach = farthest + tolerance;
    const cover = withCover && pointInPolygons(0, 0, polygons) ? Math.max(0, nearestEdge(polygons) - tolerance) : 0;
    return {
        cover,
        reach,
        miter: outlineWorstMiter(polygons, CANVAS_MITER_LIMIT),
        measuredCover: withCover,
        coverRect: undefined,
        measuredRect: false,
        outline: undefined,
        measuredOutline: false,
    };
}

/** A rectangle the fill holds, found on a grid; an edge touching it drops it. */
function measureMarkerCoverRect(path: ExtendedPath2D, size: number): MarkerCoverRect | undefined {
    const flattened = flattenMarkerPath(path);
    if (flattened == null) return undefined;
    const { bbox, tolerance, polygons } = flattened;
    const rect = gridInsideRect(polygons, bbox);
    if (rect == null || !rectClearOfEdges(polygons, rect) || !pointInPolygons(rect.x0, rect.y0, polygons)) {
        return undefined;
    }
    const width = rect.x1 - rect.x0 - 2 * tolerance;
    const height = rect.y1 - rect.y0 - 2 * tolerance;
    if (width <= 0 || height <= 0) return undefined;
    return {
        width: width / size,
        height: height / size,
        cx: (rect.x0 + rect.x1) / 2 / size,
        cy: (rect.y0 + rect.y1) / 2 / size,
    };
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
            const a = polygon[j];
            const b = polygon[i];
            if (segmentTouchesBox(a.x, a.y, b.x, b.y, rect.x0, rect.y0, rect.x1, rect.y1)) return false;
        }
    }
    return true;
}

const unitOutlines = new Map<keyof typeof MARKER_SHAPE_GEOMETRY, MarkerOutline>();

/** The outline of a built-in shape in fractions of its size; none for a circle, whose reach is its outline. */
export function markerUnitOutline(shape: keyof typeof MARKER_SHAPE_GEOMETRY): MarkerOutline | undefined {
    if (shape === 'circle') return undefined;
    let outline = unitOutlines.get(shape);
    if (outline == null) {
        const flattened = flattenMarkerPath(getSharedMarkerPath(shape, 1));
        outline = { polygons: flattened?.polygons ?? [], unit: true, tolerance: flattened?.tolerance ?? 0 };
        unitOutlines.set(shape, outline);
    }
    return outline;
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
    const outline = markerUnitOutline(shape);
    if (!painted) return { cover: 0, reach, strokeReach, snap, outline };
    return { cover: geometry.inR, coverRect: markerLabelRect(shape), reach, strokeReach, snap, outline };
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
    /** The custom path whose cover rectangle is measured only once a label needs it. */
    markerCoverPath?: AgMarkerShapeFn;
    markerReach?: number;
    markerSnap?: number;
    markerOutline?: MarkerOutline;
    /** The custom path whose outline is flattened only once a label reaches past its nominal circle. */
    markerOutlinePath?: AgMarkerShapeFn;
    markerOutset?: number;
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
        datum.markerCoverPath = undefined;
        datum.markerReach = Infinity;
        datum.markerSnap = 0;
        datum.markerOutline = undefined;
        datum.markerOutlinePath = undefined;
        datum.markerOutset = 0;
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
        datum.markerCoverRect = undefined;
        datum.markerCoverPath = deferredCoverPath(shape, painted, inputs.inside);
        datum.markerReach = casts ? Infinity : path.reach + strokeReach * path.miter;
        datum.markerOutline = undefined;
        datum.markerOutlinePath = casts || size <= 0 ? undefined : shape;
        datum.markerOutset = strokeReach * path.miter;
        return;
    }
    const geometry = MARKER_SHAPE_GEOMETRY[shape];
    datum.markerSnap = markerSnapAllowance(shape, inputs.pixelRatio);
    datum.markerCover = painted ? geometry.inR * size : 0;
    datum.markerCoverRect = painted ? markerLabelRect(shape) : undefined;
    datum.markerCoverPath = undefined;
    datum.markerReach = casts ? Infinity : geometry.circumR * size + strokeReach * geometry.miter;
    datum.markerOutline = markerUnitOutline(shape);
    datum.markerOutlinePath = undefined;
    datum.markerOutset = strokeReach * geometry.miter;
}

/** Only a painted fill under an `inside` label has a cover rectangle worth measuring. */
function deferredCoverPath(shape: AgMarkerShapeFn, painted: boolean, inside: boolean): AgMarkerShapeFn | undefined {
    return painted && inside ? shape : undefined;
}

type StampedMarkerStyle = MarkerCoverageStyle & { size?: number; shadow?: unknown; glow?: unknown };
type StampedLabelDatum = StyledMarkerCoverageDatum & {
    markerSize?: number;
    markerAnchor?: Point;
    markerInsideRect?: MarkerCoverRect;
};

/**
 * A series' stamping of each label's marker size and coverage from the style its marker is drawn in, for a series
 * whose markers differ per datum. Size and coverage come from the one style, so they always agree.
 */
export class LabelMarkerStamps {
    readonly fills = new MarkerFillMemo();
    private readonly shapes = new MarkerShapeCoverage();
    private stamping = false;
    private pixelRatio = 1;

    /** Measures the cover rectangle of a custom marker stamped without one, at the pixel ratio last stamped at. */
    readonly resolveCoverRect: MarkerCoverRectResolver = (datum: StampedLabelDatum) =>
        datum.markerCoverPath == null
            ? undefined
            : this.shapes.coverRectOf(datum.markerCoverPath, datum.markerSize ?? 0, this.pixelRatio);

    /** Flattens the outline of a custom marker stamped without one, at the pixel ratio last stamped at. */
    readonly resolveOutline: MarkerOutlineResolver = (datum: StampedLabelDatum) =>
        datum.markerOutlinePath == null
            ? undefined
            : this.shapes.outlineOf(datum.markerOutlinePath, datum.markerSize ?? 0, this.pixelRatio);

    /** Whether the label data holds stamps, which a change in marker style must re-solve. */
    get stamped(): boolean {
        return this.stamping;
    }

    /** `restyled` sees each datum once stamped, with the style it was stamped from. */
    stamp<D extends StampedLabelDatum, S extends StampedMarkerStyle>(
        labelData: readonly D[],
        styleOf: (datum: D, index: number) => S | undefined,
        settled: Omit<StyledMarkerCoverageInputs, 'shapes'>,
        restyled?: (datum: D, style: S | undefined) => void
    ): void {
        const { fills, shapes } = this;
        fills.bound(labelData.length);
        shapes.bound(labelData.length);
        const inputs: StyledMarkerCoverageInputs = { ...settled, shapes };
        this.pixelRatio = settled.pixelRatio;
        for (let index = 0; index < labelData.length; index++) {
            const datum = labelData[index];
            const style = styleOf(datum, index);
            applyStyledMarkerSize(datum, style?.size);
            datum.markerAnchor = style == null ? undefined : markerShapeAnchor(style.shape);
            datum.markerInsideRect = style == null || !inputs.inside ? undefined : markerLabelRect(style.shape);
            applyStyledMarkerCoverage(datum, style, inputs);
            restyled?.(datum, style);
        }
        this.stamping = true;
    }

    /** Drops what an earlier solve stamped on label data that is reused, so the series' own coverage applies again. */
    unstamp(labelData: readonly StampedLabelDatum[]): void {
        if (!this.stamping) return;
        for (const datum of labelData) {
            datum.markerSize = undefined;
            datum.markerAnchor = undefined;
            datum.markerCover = undefined;
            datum.markerCoverRect = undefined;
            datum.markerCoverPath = undefined;
            datum.markerReach = undefined;
            datum.markerSnap = undefined;
            datum.markerOutline = undefined;
            datum.markerOutlinePath = undefined;
            datum.markerOutset = undefined;
            datum.markerInsideRect = undefined;
        }
        this.stamping = false;
    }
}
