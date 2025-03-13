import { _ModuleSupport } from 'ag-charts-community';

const { BBox } = _ModuleSupport;

export function getTopologyShapeFillBBox(
    scale: _ModuleSupport.MercatorScale | undefined
): _ModuleSupport.ShapeFillBBox | undefined {
    if (!scale) return;
    const { range } = scale;

    const width = range[1][0] - range[0][0];
    const height = range[1][1] - range[0][1];

    const bbox = new BBox(0, 0, width, height);

    return {
        series: bbox,
        axis: bbox,
    };
}
