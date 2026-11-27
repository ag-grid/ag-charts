import type { Geometry, Position } from 'ag-charts-core';

import { projectGeometry } from './geometryUtil';
import { type GapIndexRegion, type GapRingInfo, MapShapeGapIndex } from './mapShapeGapIndex';
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

    // `getPolygonRingInfo` builds a new array, so its result is kept per source polygon until the index is rebuilt. A
    // projection refresh then allocates only the inset output. `null` records a polygon with no moved edge.
    private polygonInfos = new WeakMap<readonly (readonly Position[])[], (GapRingInfo | undefined)[] | null>();

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
        this.polygonInfos = new WeakMap();
    }

    /** The ring infos of a source polygon, aligned with its rings, or `undefined` when none has a moved edge. */
    getPolygonRingInfo(polygon: readonly (readonly Position[])[]): (GapRingInfo | undefined)[] | undefined {
        let infos = this.polygonInfos.get(polygon);
        if (infos === undefined) {
            infos = this.index.getPolygonRingInfo(polygon) ?? null;
            this.polygonInfos.set(polygon, infos);
        }
        return infos ?? undefined;
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

function insetPolygon(
    source: Position[][],
    projected: Position[][],
    neighbours: MapShapeGapNeighbours,
    d: number
): Position[][] {
    const ringInfo = neighbours.getPolygonRingInfo(source);
    if (ringInfo == null) return projected;
    // A collapsed polygon keeps its place as no rings, so polygon indices match the undrawn geometry.
    return insetPolygonRings(projected, ringInfo, d) ?? [];
}

/**
 * The drawn copy of `projected`, inset by `d` along shared borders; `source` is its fixed-scale twin.
 * Parts with no moved edge come back as the same objects.
 */
export function insetGeometry(
    source: Geometry,
    projected: Geometry,
    neighbours: MapShapeGapNeighbours,
    d: number
): Geometry {
    if (projected.type === 'Polygon' && source.type === 'Polygon') {
        const coordinates = insetPolygon(source.coordinates, projected.coordinates, neighbours, d);
        return coordinates === projected.coordinates ? projected : { type: 'Polygon', coordinates };
    }

    // The replacement container is allocated when the first child changes, so unchanged geometry allocates nothing.
    if (projected.type === 'MultiPolygon' && source.type === 'MultiPolygon') {
        const polygons = projected.coordinates;
        let coordinates: Position[][][] | undefined;
        for (let i = 0; i < polygons.length; i += 1) {
            const inset = insetPolygon(source.coordinates[i], polygons[i], neighbours, d);
            if (coordinates == null) {
                if (inset === polygons[i]) continue;
                coordinates = polygons.slice(0, i);
            }
            coordinates.push(inset);
        }
        return coordinates == null ? projected : { type: 'MultiPolygon', coordinates };
    }

    if (projected.type === 'GeometryCollection' && source.type === 'GeometryCollection') {
        const members = projected.geometries;
        let geometries: Geometry[] | undefined;
        for (let i = 0; i < members.length; i += 1) {
            const inset = insetGeometry(source.geometries[i], members[i], neighbours, d);
            if (geometries == null) {
                if (inset === members[i]) continue;
                geometries = members.slice(0, i);
            }
            geometries.push(inset);
        }
        return geometries == null ? projected : { type: 'GeometryCollection', geometries };
    }

    return projected;
}

/**
 * The polygon of `drawn` that matches `polygon` of `projected`. The drawn copy has the same shape as the projected geometry,
 * so both are walked together and nothing is allocated. Undefined when `polygon` isn't part of `projected`.
 */
export function findDrawnPolygon(
    projected: Geometry,
    drawn: Geometry,
    polygon: Position[][]
): Position[][] | undefined {
    switch (projected.type) {
        case 'Polygon':
            return projected.coordinates === polygon && drawn.type === 'Polygon' ? drawn.coordinates : undefined;
        case 'MultiPolygon': {
            const i = projected.coordinates.indexOf(polygon);
            return i < 0 || drawn.type !== 'MultiPolygon' ? undefined : drawn.coordinates[i];
        }
        case 'GeometryCollection': {
            if (drawn.type !== 'GeometryCollection') return undefined;
            for (let i = 0; i < projected.geometries.length; i += 1) {
                const member = drawn.geometries[i];
                const found = member == null ? undefined : findDrawnPolygon(projected.geometries[i], member, polygon);
                if (found != null) return found;
            }
            return undefined;
        }
        default:
            return undefined;
    }
}
