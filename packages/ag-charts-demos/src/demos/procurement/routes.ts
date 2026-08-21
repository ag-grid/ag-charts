// Route topology for the delivery map.
//
// AG Charts ships no geography of its own, so the base world map comes from the
// web-analytics demo's country boundaries (Eurostat/GISCO), shared rather than copied —
// it is 20k lines of coordinates. The routes below are generated: one per active shipment in
// the manager's own scope, along the same arc the tracking feed interpolates the marker's
// position on, so a marker always sits on its own line.
import type { GeoJSON } from 'ag-charts-community';

import { topology as worldTopology } from '../web-analytics/topology';
import { routeSegments } from './geo';
import { MY_SHIPMENTS } from './workspace';

export const WORLD_TOPOLOGY = worldTopology as GeoJSON;

/**
 * One route per shipment, keyed by the map's shared `id` field.
 *
 * `MultiLineString` rather than `LineString` because a trans-Pacific route is cut at the
 * antimeridian into two pieces — see `routeSegments`.
 */
export const ROUTE_TOPOLOGY: GeoJSON = {
    type: 'FeatureCollection',
    features: MY_SHIPMENTS.map((shipment) => ({
        type: 'Feature',
        properties: { id: shipment.shipmentId },
        geometry: {
            type: 'MultiLineString',
            coordinates: routeSegments(shipment.origin, shipment.destination),
        },
    })),
};
