import type { Position } from 'ag-charts-core';

/** A drawn region, as seen by the neighbour index. The index knows nothing about series or visibility. */
export interface GapIndexRegion {
    /** `true` when the region's `gap` is greater than 0. */
    readonly hasGap: boolean;
    /** The region's polygons. Each polygon is a list of closed rings, the exterior at index 0 and holes after. */
    readonly polygons: readonly (readonly (readonly Position[])[])[];
}

/** A maximal sequence of moved edges, ending where the ring leaves the border or meets a third ring. */
export interface GapRun {
    /** Index of the first vertex of the run, in ring order. For a closed run this is the canonical anchor. */
    readonly start: number;
    /** Number of edges in the run. A closed run (a whole cycle) has `length === vertexCount`. */
    readonly length: number;
    /**
     * `true` when the canonical end (the endpoint with the lower coordinate key) is the run's last vertex. A closed run
     * walks from its anchor towards the neighbour with the lower coordinate key.
     */
    readonly reversed: boolean;
}

/** What the inset pass needs to know about one ring that has at least one moved edge. */
export interface GapRingInfo {
    /** Number of distinct ring vertices: the ring without its repeated closing vertex. */
    readonly vertexCount: number;
    /** `true` for a hole (ring index > 0), `false` for an exterior. */
    readonly hole: boolean;
    /** Sign of the shoelace area of the ring as indexed, which has the handedness of its screen projection. */
    readonly orientation: 1 | -1;
    /** One byte per edge (`i` is the edge from vertex `i` to vertex `i + 1`): `1` when the edge is moved. */
    readonly movedEdges: Uint8Array;
    /** The shared runs, in ring order. */
    readonly runs: readonly GapRun[];
    /** One byte per vertex: `1` for a vertex used by 3 or more rings (a tripoint) and for the anchor of a closed run. */
    readonly pinned: Uint8Array;
}

/** Counts from the last `build`, for tests and diagnostics. */
export interface GapIndexStats {
    /** Rings after deduplication. */
    readonly rings: number;
    /** Distinct vertex coordinates. */
    readonly vertices: number;
    /** Distinct undirected edges. */
    readonly edges: number;
    /** Distinct undirected edges contained by 2 or more rings. */
    readonly sharedEdges: number;
    /** Shared edges where at least one owner has `gap > 0`: the edges that move. */
    readonly movedEdges: number;
}

interface CanonicalRing {
    readonly ids: Int32Array;
    readonly hole: boolean;
    hasGap: boolean;
    readonly sources: (readonly Position[])[];
}

interface EdgeEntry {
    count: number;
    lastRing: number;
    gapped: boolean;
}

const EMPTY_STATS: GapIndexStats = { rings: 0, vertices: 0, edges: 0, sharedEdges: 0, movedEdges: 0 };

function compareCoords(a: Position, b: Position): number {
    const dx = a[0] - b[0];
    return dx === 0 ? a[1] - b[1] : dx;
}

function isClosed(ring: readonly Position[]): boolean {
    const n = ring.length;
    return n > 1 && ring[0][0] === ring[n - 1][0] && ring[0][1] === ring[n - 1][1];
}

function shoelaceSign(ring: readonly Position[], n: number): 1 | -1 {
    let area = 0;
    for (let i = 0; i < n; i += 1) {
        const [x0, y0] = ring[i];
        const [x1, y1] = ring[(i + 1) % n];
        area += x0 * y1 - x1 * y0;
    }
    return area < 0 ? -1 : 1;
}

export class MapShapeGapIndex {
    private rings = new WeakMap<readonly Position[], GapRingInfo>();
    private statistics: GapIndexStats = EMPTY_STATS;

    /** Counts from the last `build`. */
    get stats(): GapIndexStats {
        return this.statistics;
    }

    /** The info for a source ring object, or `undefined` when it has no moved edge. Duplicated rings each get one. */
    getRingInfo(ring: readonly Position[]): GapRingInfo | undefined {
        return this.rings.get(ring);
    }

    /** The ring infos of a polygon, aligned with its rings, or `undefined` when none of them has a moved edge. */
    getPolygonRingInfo(polygon: readonly (readonly Position[])[]): (GapRingInfo | undefined)[] | undefined {
        let infos: (GapRingInfo | undefined)[] | undefined;
        for (let i = 0; i < polygon.length; i += 1) {
            const info = this.rings.get(polygon[i]);
            if (info == null) continue;
            infos ??= new Array(polygon.length).fill(undefined);
            infos[i] = info;
        }
        return infos;
    }

    /** Replaces the index contents with the neighbour structure of `regions`. */
    build(regions: readonly GapIndexRegion[]): void {
        this.rings = new WeakMap();
        this.statistics = EMPTY_STATS;

        const vertexIds = new Map<string, number>();
        const vertices: Position[] = [];
        const canonical: CanonicalRing[] = [];
        const buckets = new Map<string, CanonicalRing[]>();

        // Pass 1: assign vertex ids and deduplicate rings by role and ordered vertex sequence.
        for (const region of regions) {
            for (const polygon of region.polygons) {
                for (let r = 0; r < polygon.length; r += 1) {
                    const ring = polygon[r];
                    const ids = this.ringVertexIds(ring, vertexIds, vertices);
                    if (ids == null) continue;

                    const hole = r > 0;
                    let hash = 0;
                    for (let i = 0; i < ids.length; i += 1) {
                        hash = Math.imul(hash, 31) + ids[i];
                    }
                    const key = `${hole ? 1 : 0}:${ids.length}:${hash}`;
                    let bucket = buckets.get(key);
                    if (bucket == null) {
                        bucket = [];
                        buckets.set(key, bucket);
                    }

                    let match = bucket.find((c) => sameIds(c.ids, ids));
                    if (match == null) {
                        match = { ids, hole, hasGap: false, sources: [] };
                        bucket.push(match);
                        canonical.push(match);
                    }
                    // A merged ring is gapped if any owner is
                    match.hasGap ||= region.hasGap;
                    match.sources.push(ring);
                }
            }
        }

        // Pass 2: count the rings that contain each undirected edge and each vertex .
        const vertexCount = vertices.length;
        const vertexDegree = new Int32Array(vertexCount);
        const vertexLastRing = new Int32Array(vertexCount).fill(-1);
        const edges = new Map<number, EdgeEntry>();

        for (let c = 0; c < canonical.length; c += 1) {
            const { ids, hasGap } = canonical[c];
            const n = ids.length;
            for (let i = 0; i < n; i += 1) {
                const a = ids[i];
                const b = ids[(i + 1) % n];

                if (vertexLastRing[a] !== c) {
                    vertexLastRing[a] = c;
                    vertexDegree[a] += 1;
                }
                if (a === b) continue;

                const edgeKey = a < b ? a * vertexCount + b : b * vertexCount + a;
                let entry = edges.get(edgeKey);
                if (entry == null) {
                    entry = { count: 0, lastRing: -1, gapped: false };
                    edges.set(edgeKey, entry);
                }
                // Count rings, not occurrences: a ring that visits an edge twice doesn't neighbour itself.
                if (entry.lastRing !== c) {
                    entry.lastRing = c;
                    entry.count += 1;
                }
                entry.gapped ||= hasGap;
            }
        }

        // Pass 3: per ring, the moved edges, the pinned vertices and the shared runs.
        let sharedEdges = 0;
        let movedEdgeCount = 0;
        for (const entry of edges.values()) {
            if (entry.count < 2) continue;
            sharedEdges += 1;
            if (entry.gapped) movedEdgeCount += 1;
        }

        for (const ring of canonical) {
            const info = this.ringInfo(ring, edges, vertexCount, vertexDegree, vertices);
            if (info == null) continue;
            for (const source of ring.sources) {
                this.rings.set(source, info);
            }
        }

        this.statistics = {
            rings: canonical.length,
            vertices: vertexCount,
            edges: edges.size,
            sharedEdges,
            movedEdges: movedEdgeCount,
        };
    }

    private ringVertexIds(
        ring: readonly Position[],
        vertexIds: Map<string, number>,
        vertices: Position[]
    ): Int32Array | undefined {
        const n = isClosed(ring) ? ring.length - 1 : ring.length;
        // Degenerate rings (fewer than 3 vertices, NaN coordinates) never neighbour anything.
        if (n < 3) return undefined;

        const ids = new Int32Array(n);
        const distinct = new Set<number>();
        for (let i = 0; i < n; i += 1) {
            const position = ring[i];
            const [x, y] = position;
            if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;

            const key = `${x},${y}`;
            let id = vertexIds.get(key);
            if (id == null) {
                id = vertices.length;
                vertexIds.set(key, id);
                vertices.push(position);
            }
            ids[i] = id;
            distinct.add(id);
        }
        return distinct.size >= 3 ? ids : undefined;
    }

    private ringInfo(
        ring: CanonicalRing,
        edges: Map<number, EdgeEntry>,
        vertexCount: number,
        vertexDegree: Int32Array,
        vertices: Position[]
    ): GapRingInfo | undefined {
        const { ids, hole } = ring;
        const n = ids.length;

        const movedEdges = new Uint8Array(n);
        let movedCount = 0;
        for (let i = 0; i < n; i += 1) {
            const a = ids[i];
            const b = ids[(i + 1) % n];
            if (a === b) continue;

            const entry = edges.get(a < b ? a * vertexCount + b : b * vertexCount + a);
            if (entry != null && entry.count >= 2 && entry.gapped) {
                movedEdges[i] = 1;
                movedCount += 1;
            }
        }
        if (movedCount === 0) return undefined;

        const pinned = new Uint8Array(n);
        for (let i = 0; i < n; i += 1) {
            pinned[i] = vertexDegree[ids[i]] >= 3 ? 1 : 0;
        }

        const runs = buildRuns(ids, movedEdges, pinned, vertices);
        const source = ring.sources[0];
        return { vertexCount: n, hole, orientation: shoelaceSign(source, n), movedEdges, runs, pinned };
    }
}

function sameIds(a: Int32Array, b: Int32Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/** Splits the moved edges into runs that end at unmoved edges or pinned vertices, so both rings on a border agree. */
function buildRuns(ids: Int32Array, moved: Uint8Array, pinned: Uint8Array, vertices: Position[]): GapRun[] {
    const n = ids.length;
    const position = (i: number) => vertices[ids[i]];
    const isBreak = (i: number) => pinned[i] === 1 || moved[(i + n - 1) % n] === 0 || moved[i] === 0;

    let first = -1;
    for (let i = 0; i < n; i += 1) {
        if (isBreak(i)) {
            first = i;
            break;
        }
    }

    if (first === -1) {
        // A fully shared cycle with no tripoint (an enclave and its host's hole): anchor on the lowest coordinate key.
        let anchor = 0;
        for (let i = 1; i < n; i += 1) {
            if (compareCoords(position(i), position(anchor)) < 0) anchor = i;
        }
        pinned[anchor] = 1;
        return [closedRun(anchor, n, position)];
    }

    const runs: GapRun[] = [];
    let i = first;
    let visited = 0;
    while (visited < n) {
        if (moved[i] === 0) {
            i = (i + 1) % n;
            visited += 1;
            continue;
        }

        const start = i;
        let length = 0;
        do {
            i = (i + 1) % n;
            length += 1;
            visited += 1;
        } while (!isBreak(i));

        if (length === n) {
            // One pinned vertex on an otherwise fully shared ring: a closed run anchored on it.
            runs.push(closedRun(start, n, position));
        } else {
            runs.push({ start, length, reversed: compareCoords(position(i), position(start)) < 0 });
        }
    }
    return runs;
}

function closedRun(anchor: number, n: number, position: (i: number) => Position): GapRun {
    const next = position((anchor + 1) % n);
    const prev = position((anchor + n - 1) % n);
    return { start: anchor, length: n, reversed: compareCoords(prev, next) < 0 };
}
