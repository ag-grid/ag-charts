import type { _ModuleSupport, _Scene } from 'ag-charts-community';
type AnimatableMapMarkerDatum = {
    scalingX: number;
    scalingY: number;
};
export declare function prepareMapMarkerAnimationFunctions(): {
    fromFn: _ModuleSupport.FromToMotionPropFn<_Scene.Marker, AnimatableMapMarkerDatum, unknown>;
    toFn: _ModuleSupport.FromToMotionPropFn<_Scene.Marker, AnimatableMapMarkerDatum, unknown>;
};
export {};
