import type { _ModuleSupport, _Scene } from 'ag-charts-community';

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
