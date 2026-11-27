import type { Position } from 'ag-charts-core';

import { type GapIndexRegion, MapShapeGapIndex } from '../map-util/mapShapeGapIndex';
import { MercatorScale } from '../map-util/mercatorScale';

type Ring = Position[];
type Polygon = Ring[];

interface TestFeature {
    properties?: { name?: string };
    geometry: { type: string; coordinates: any };
}

export interface GapTopology {
    features: TestFeature[];
}

export function featurePolygons(feature: TestFeature): Polygon[] {
    switch (feature.geometry.type) {
        case 'Polygon':
            return [feature.geometry.coordinates];
        case 'MultiPolygon':
            return feature.geometry.coordinates;
        default:
            return [];
    }
}

export function topologyRegions(topology: GapTopology, hasGap = true): GapIndexRegion[] {
    return topology.features
        .map((feature) => ({ hasGap, polygons: featurePolygons(feature) }))
        .filter((region) => region.polygons.length > 0);
}

export interface GapScene {
    index: MapShapeGapIndex;
    /** Fixed-scale polygons, the keys of the index. */
    fixed: Polygon[];
    /** Screen-space polygons at the requested zoom, aligned with `fixed`. */
    screen: Polygon[];
    /** The polygons of each feature that has any, as `fixed[first]` to `fixed[first + count - 1]`. */
    features: { name: string | undefined; first: number; count: number }[];
}

export function bounds(topology: GapTopology): { lon0: number; lat0: number; lon1: number; lat1: number } {
    let lon0 = Infinity;
    let lat0 = Infinity;
    let lon1 = -Infinity;
    let lat1 = -Infinity;
    for (const feature of topology.features) {
        for (const polygon of featurePolygons(feature)) {
            for (const [lon, lat] of polygon[0]) {
                lon0 = Math.min(lon0, lon);
                lon1 = Math.max(lon1, lon);
                lat0 = Math.min(lat0, lat);
                lat1 = Math.max(lat1, lat);
            }
        }
    }
    return { lon0, lat0, lon1, lat1 };
}

/**
 * Builds the index from the fixed-scale projection, and projects every ring to screen space at `zoom` times the
 * extent of the topology (centred on its middle, or on `centre`).
 */
export function createScene(
    topology: GapTopology,
    zoom: number,
    options: { width?: number; height?: number; centre?: Position; hasGap?: (featureIndex: number) => boolean } = {}
): GapScene {
    const { width = 900, height = 600, centre, hasGap = () => true } = options;
    const fixedScale = MercatorScale.fixedScale();
    const b = bounds(topology);
    const cLon = centre?.[0] ?? (b.lon0 + b.lon1) / 2;
    const cLat = centre?.[1] ?? (b.lat0 + b.lat1) / 2;
    const halfLon = (b.lon1 - b.lon0) / 2 / zoom;
    const halfLat = (b.lat1 - b.lat0) / 2 / zoom;
    const scale = new MercatorScale(
        [
            [cLon - halfLon, cLat - halfLat],
            [cLon + halfLon, cLat + halfLat],
        ],
        [
            [0, 0],
            [width, height],
        ]
    );

    const fixed: Polygon[] = [];
    const screen: Polygon[] = [];
    const regions: GapIndexRegion[] = [];
    const features: GapScene['features'] = [];
    for (const [f, feature] of topology.features.entries()) {
        const polygons = featurePolygons(feature);
        if (polygons.length === 0) continue;
        features.push({ name: feature.properties?.name, first: fixed.length, count: polygons.length });
        const fixedPolygons = polygons.map((polygon) => polygon.map((ring) => ring.map((p) => fixedScale.convert(p))));
        regions.push({ hasGap: hasGap(f), polygons: fixedPolygons });
        for (let i = 0; i < polygons.length; i += 1) {
            fixed.push(fixedPolygons[i]);
            screen.push(polygons[i].map((ring) => ring.map((p) => scale.convert(p))));
        }
    }

    const index = new MapShapeGapIndex();
    index.build(regions);
    return { index, fixed, screen, features };
}
