import {
    BBox,
    type BoxBounds,
    type DistantObject,
    type Group,
    type Logger,
    type Node,
    type Point,
    type QuadtreeNearest,
    boxContains,
} from 'ag-charts-core';

import type { SeriesNodePickMatch } from '../pickTypes';
import type { SeriesNodeDatum } from '../seriesTypes';

export type QuadtreeCompatibleNode<D> = Node<D> & DistantObject & { readonly midPoint: { x: number; y: number } };

/**
 * A shape's bounds before any gap inset, for a series whose drawn nodes leave the gap unpicked. One per node lifetime:
 * `setBounds` updates it in place, so a rebuild allocates nothing.
 */
export class QuadtreePickBBox extends BBox {
    readonly midPoint = { x: 0, y: 0 };

    constructor() {
        super(0, 0, 0, 0);
    }

    setBounds(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.midPoint.x = x + width / 2;
        this.midPoint.y = y + height / 2;
    }
}

/** A datum drawn inset by a gap, which keeps its span along the gap axis from before the inset for picking. */
export interface GapPickDatum {
    /** The span along the gap axis before the inset; only written, and only read, while the gap is on. */
    readonly pickStart: number;
    readonly pickLength: number;
    /** Created on first pick and updated in place, so a data update writes only the two numbers above. */
    pickBBox: QuadtreePickBBox | undefined;
}

/**
 * Adds each datum's bounds from before the gap inset, so the quadtree picks the gap as part of the shape. `drawnBounds`
 * supplies the extent across the gap axis.
 */
export function addGapPickBoxesToQuadtree<TDatum extends SeriesNodeDatum & GapPickDatum>(
    quadtree: QuadtreeNearest<TDatum>,
    nodeData: Iterable<TDatum>,
    gapAlongX: boolean,
    drawnBounds: (datum: TDatum) => BoxBounds | undefined
): void {
    for (const datum of nodeData) {
        const drawn = drawnBounds(datum);
        if (drawn == null || datum.pickLength <= 0 || datum.missing) continue;
        const pickBBox = (datum.pickBBox ??= new QuadtreePickBBox());
        if (gapAlongX) {
            pickBBox.setBounds(datum.pickStart, drawn.y, datum.pickLength, drawn.height);
        } else {
            pickBBox.setBounds(drawn.x, datum.pickStart, drawn.width, datum.pickLength);
        }
        quadtree.addValue(pickBBox, datum);
    }
}

/**
 * The exact-shape pick for a point in a gap strip, for a series whose exact-shape test found nothing: the drawn shape
 * already decides inside itself, so only a quadtree hit outside it is added.
 */
export function pickGapStrip<TDatum extends SeriesNodeDatum & GapPickDatum>(
    series: SeriesWithQuadtreeNearest<TDatum>,
    point: Point,
    drawnBounds: (datum: TDatum) => BoxBounds | undefined
): SeriesNodePickMatch[] {
    const match = findQuadtreeMatch(series, point);
    if (match?.distance !== 0) return [];
    const drawn = drawnBounds(match.datum as TDatum);
    return drawn != null && boxContains(drawn, point.x, point.y) ? [] : [match];
}

export function addHitTestersToQuadtree<TDatum extends SeriesNodeDatum, TNode extends QuadtreeCompatibleNode<TDatum>>(
    quadtree: QuadtreeNearest<TDatum>,
    hitTesters: Iterable<TNode>,
    logger: Logger
) {
    for (const node of hitTesters) {
        const datum: TDatum | undefined = node.datum;
        if (datum === undefined) {
            logger.error('undefined datum');
        } else {
            quadtree.addValue(node, datum);
        }
    }
}

type SeriesWithQuadtreeNearest<TDatum extends SeriesNodeDatum> = {
    readonly contentGroup: Group;
    getQuadTree(): QuadtreeNearest<TDatum>;
};

export function findQuadtreeMatch<TDatum extends SeriesNodeDatum>(
    series: SeriesWithQuadtreeNearest<TDatum>,
    point: Point
): SeriesNodePickMatch | undefined {
    const { x, y } = point;
    const { nearest, distanceSquared } = series.getQuadTree().find(x, y);
    if (nearest !== undefined) {
        return { datum: nearest.value, distance: Math.sqrt(distanceSquared), target: series.contentGroup };
    }

    return undefined;
}
