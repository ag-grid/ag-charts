import type { Geometry, Position } from 'ag-charts-core';

import { projectGeometry } from './geometryUtil';
import { type GapIndexRegion, MapShapeGapIndex } from './mapShapeGapIndex';
import { MercatorScale } from './mercatorScale';
import { insetPolygonRings } from './polygonGapInset';

const fixedScale = MercatorScale.fixedScale();
const fixedGeometries = new WeakMap<Geometry, Geometry>();

/**
 * The geometry at the fixed scale, which is what the index is built from: the screen handedness of a ring, which the inset
 * needs, is that of its projection rather than of its longitudes and latitudes. The same input geometry gives the same
 * object back, so the index finds its rings again.
 */
export function fixedScaleGeometry(geometry: Geometry): Geometry {
    let fixed = fixedGeometries.get(geometry);
    if (fixed == null) {
        fixed = projectGeometry(geometry, fixedScale);
        fixedGeometries.set(geometry, fixed);
    }
    return fixed;
}

/** What the neighbour index reads from one `map-shape` series. */
export interface MapShapeGapSource {
    readonly visible: boolean;
    /** `true` when the series' `gap` is greater than 0. */
    readonly hasGap: boolean;
    /** Changes whenever the series processes its data again. */
    readonly gapDataVersion: number;
    readonly gapTopology: unknown;
    /** `true` when rows without a colour value are dropped rather than drawn with `missingDataFill`. */
    readonly dropsMissingColor: boolean;
    /** The drawn regions of the series, in data order. */
    getGapRegions(): GapIndexRegion[];
    /** Makes the series rebuild its node data, and so its insets, in the next update. */
    requestGapRefresh(): void;
}

const KEY_STRIDE = 6;

function keyMatches(key: readonly unknown[] | undefined, sources: readonly MapShapeGapSource[]): boolean {
    if (key?.length !== sources.length * KEY_STRIDE) return false;
    for (let i = 0; i < sources.length; i += 1) {
        const source = sources[i];
        const at = i * KEY_STRIDE;
        if (
            key[at] !== source ||
            key[at + 1] !== source.visible ||
            key[at + 2] !== source.hasGap ||
            key[at + 3] !== source.gapDataVersion ||
            key[at + 4] !== source.gapTopology ||
            key[at + 5] !== source.dropsMissingColor
        ) {
            return false;
        }
    }
    return true;
}

function buildKey(sources: readonly MapShapeGapSource[]): unknown[] {
    const key: unknown[] = [];
    for (const source of sources) {
        key.push(
            source,
            source.visible,
            source.hasGap,
            source.gapDataVersion,
            source.gapTopology,
            source.dropsMissingColor
        );
    }
    return key;
}

/**
 * Owns the neighbour index of every `map-shape` series in a chart. The chart tells it about the series on each layout, and
 * a series asks it to `ensure` the index before it insets its regions.
 */
export class MapShapeGapNeighbours {
    readonly index = new MapShapeGapIndex();

    private sources: readonly MapShapeGapSource[] = [];
    private layoutKey: readonly unknown[] | undefined;
    private builtKey: readonly unknown[] | undefined;

    /** Whether any visible series has a gap, which is the only time the index is worth building. */
    get active(): boolean {
        for (const source of this.sources) {
            if (source.visible && source.hasGap) return true;
        }
        return false;
    }

    /**
     * Takes the chart's current `map-shape` series. When anything the index depends on changed since the last call, every
     * series is asked to rebuild its node data, as each one's insets depend on its neighbours.
     */
    update(sources: readonly MapShapeGapSource[]): void {
        this.sources = sources;
        if (keyMatches(this.layoutKey, sources)) return;

        this.layoutKey = buildKey(sources);
        for (const source of sources) {
            source.requestGapRefresh();
        }
    }

    /** Rebuilds the index when its inputs changed since it was last built. */
    ensure(): void {
        const { sources } = this;
        if (keyMatches(this.builtKey, sources)) return;

        this.builtKey = buildKey(sources);
        const regions: GapIndexRegion[] = [];
        for (const source of sources) {
            if (!source.visible) continue;
            for (const region of source.getGapRegions()) {
                regions.push(region);
            }
        }
        this.index.build(regions);
    }
}

/** The polygons of a geometry, each a list of rings. Lines and points have none. */
export function collectPolygons(geometry: Geometry, into: Position[][][] = []): Position[][][] {
    switch (geometry.type) {
        case 'Polygon':
            into.push(geometry.coordinates);
            break;
        case 'MultiPolygon':
            for (const polygon of geometry.coordinates) {
                into.push(polygon);
            }
            break;
        case 'GeometryCollection':
            for (const g of geometry.geometries) {
                collectPolygons(g, into);
            }
            break;
    }
    return into;
}

function insetPolygon(source: Position[][], projected: Position[][], index: MapShapeGapIndex, d: number): Position[][] {
    const ringInfo = index.getPolygonRingInfo(source);
    if (ringInfo == null) return projected;
    // A collapsed polygon keeps its place as no rings, so polygon indices match the undrawn geometry.
    return insetPolygonRings(projected, ringInfo, d) ?? [];
}

/**
 * The drawn copy of `projected`, with every polygon inset by `d` along its shared borders. `source` is the same geometry
 * at the fixed scale, whose rings the index knows. Returns `projected` itself when nothing moves, and the same polygon arrays for
 * polygons that have no moved edge.
 */
export function insetGeometry(source: Geometry, projected: Geometry, index: MapShapeGapIndex, d: number): Geometry {
    if (projected.type === 'Polygon' && source.type === 'Polygon') {
        const coordinates = insetPolygon(source.coordinates, projected.coordinates, index, d);
        return coordinates === projected.coordinates ? projected : { type: 'Polygon', coordinates };
    }

    if (projected.type === 'MultiPolygon' && source.type === 'MultiPolygon') {
        let changed = false;
        const coordinates = projected.coordinates.map((polygon, i) => {
            const inset = insetPolygon(source.coordinates[i], polygon, index, d);
            changed ||= inset !== polygon;
            return inset;
        });
        return changed ? { type: 'MultiPolygon', coordinates } : projected;
    }

    if (projected.type === 'GeometryCollection' && source.type === 'GeometryCollection') {
        let changed = false;
        const geometries = projected.geometries.map((geometry, i) => {
            const inset = insetGeometry(source.geometries[i], geometry, index, d);
            changed ||= inset !== geometry;
            return inset;
        });
        return changed ? { type: 'GeometryCollection', geometries } : projected;
    }

    return projected;
}

/**
 * Where `polygon` sits in `geometry`: the index of each collection member and multi-polygon part on the way down. The same
 * path leads to the matching polygon of the drawn copy, which has the same shape.
 */
export function polygonPath(geometry: Geometry, polygon: Position[][], path: number[] = []): number[] | undefined {
    switch (geometry.type) {
        case 'Polygon':
            return geometry.coordinates === polygon ? path : undefined;
        case 'MultiPolygon': {
            const i = geometry.coordinates.indexOf(polygon);
            return i < 0 ? undefined : [...path, i];
        }
        case 'GeometryCollection':
            for (let i = 0; i < geometry.geometries.length; i += 1) {
                const found = polygonPath(geometry.geometries[i], polygon, [...path, i]);
                if (found != null) return found;
            }
            return undefined;
        default:
            return undefined;
    }
}

export function polygonAtPath(geometry: Geometry, path: readonly number[], depth = 0): Position[][] | undefined {
    switch (geometry.type) {
        case 'Polygon':
            return geometry.coordinates;
        case 'MultiPolygon':
            return geometry.coordinates[path[depth]];
        case 'GeometryCollection': {
            const member = geometry.geometries[path[depth]];
            return member == null ? undefined : polygonAtPath(member, path, depth + 1);
        }
        default:
            return undefined;
    }
}
