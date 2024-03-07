import { _ModuleSupport } from 'ag-charts-community';

const { LonLatBBox } = _ModuleSupport;

export function extendBbox(
    into: _ModuleSupport.LonLatBBox | undefined,
    lon0: number,
    lat0: number,
    lon1: number,
    lat1: number
): _ModuleSupport.LonLatBBox {
    if (into == null) {
        into = new LonLatBBox(lon0, lat0, lon1, lat1);
    } else {
        // @todo(AG-10831) Handle anti-meridian
        into.lon0 = Math.min(into.lon0, lon0);
        into.lat0 = Math.min(into.lat0, lat0);
        into.lon1 = Math.max(into.lon1, lon1);
        into.lat1 = Math.max(into.lat1, lat1);
    }

    return into;
}
