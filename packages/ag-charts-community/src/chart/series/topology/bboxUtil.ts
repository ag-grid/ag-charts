import { LatLongBBox } from './LatLongBBox';

export function extendBbox(
    into: LatLongBBox | undefined,
    lon0: number,
    lat0: number,
    lon1: number,
    lat1: number
): LatLongBBox {
    if (into == null) {
        into = new LatLongBBox(lat0, lon0, lat1, lon1);
    } else {
        // @todo(AG-10831) Handle anti-meridian
        into.lat0 = Math.min(into.lat0, lat0);
        into.lon0 = Math.min(into.lon0, lon0);
        into.lat1 = Math.max(into.lat1, lat0);
        into.lon1 = Math.max(into.lon1, lon0);
    }

    return into;
}
