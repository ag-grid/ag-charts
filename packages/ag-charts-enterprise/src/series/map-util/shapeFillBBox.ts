import { _ModuleSupport } from 'ag-charts-community';

import type { MercatorScale } from './mercatorScale';

const { BBox } = _ModuleSupport;

export function getTopologyShapeFillBBox(scale: MercatorScale | undefined): _ModuleSupport.ShapeFillBBox | undefined {
    if (!scale) return;
    const { range } = scale;

    const x = range[0][0];
    const y = range[0][1];
    const width = range[1][0] - x;
    const height = range[1][1] - y;

    const bbox = new BBox(x, y, width, height);

    return {
        series: bbox,
        axis: bbox,
    };
}
