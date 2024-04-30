import type { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { GeoGeometry } from './geoGeometry';
type AnimatableMapMarkerDatum = {
    scalingX: number;
    scalingY: number;
};
export declare function prepareMapMarkerAnimationFunctions(): {
    fromFn: _ModuleSupport.FromToMotionPropFn<_Scene.Marker, AnimatableMapMarkerDatum, unknown>;
    toFn: _ModuleSupport.FromToMotionPropFn<_Scene.Marker, AnimatableMapMarkerDatum, unknown>;
};
type SomeMapSeries<TDatum> = {
    contextNodeData?: {
        nodeData: TDatum[];
    };
    datumSelection: _Scene.Selection<GeoGeometry, TDatum>;
};
export declare function computeGeoFocusBounds<TDatum>(series: SomeMapSeries<TDatum>, opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
export {};
