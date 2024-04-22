import type { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { GeoGeometry } from './geoGeometry';

type AnimatableMapMarkerDatum = {
    scalingX: number;
    scalingY: number;
};

export function prepareMapMarkerAnimationFunctions() {
    const fromFn: _ModuleSupport.FromToMotionPropFn<_Scene.Marker, AnimatableMapMarkerDatum, unknown> = (
        marker,
        _datum,
        status
    ) => {
        if (status === 'removed') {
            return { scalingX: 1, scalingY: 1 };
        } else if (marker.previousDatum == null) {
            return { scalingX: 0, scalingY: 0 };
        }
        return { scalingX: marker.scalingX, scalingY: marker.scalingY };
    };
    const toFn: _ModuleSupport.FromToMotionPropFn<_Scene.Marker, AnimatableMapMarkerDatum, unknown> = (
        _marker,
        _datum,
        status
    ) => {
        if (status === 'removed') {
            return { scalingX: 0, scalingY: 0 };
        }
        return { scalingX: 1, scalingY: 1 };
    };

    return { fromFn, toFn };
}

type SomeMapSeries<TDatum> = {
    contextNodeData?: { nodeData: TDatum[] };
    datumSelection: _Scene.Selection<GeoGeometry, TDatum>;
};

export function computeGeoFocusBounds<TDatum>(
    series: SomeMapSeries<TDatum>,
    opts: _ModuleSupport.PickFocusInputs
): _Scene.BBox | undefined {
    const datum = series.contextNodeData?.nodeData[opts.datumIndex];
    if (datum === undefined) return undefined;

    for (const node of series.datumSelection.nodes()) {
        if (node.datum === datum) {
            return node.computeTransformedBBox();
        }
    }

    return undefined;
}
