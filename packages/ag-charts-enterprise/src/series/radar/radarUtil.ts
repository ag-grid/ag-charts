import { _ModuleSupport } from 'ag-charts-community';

type MarkerLike = {
    enabled: boolean;
};
type RadarLike = {
    properties: {
        marker: MarkerLike;
        selection: { enabled: boolean };
        styler?: Function;
    };
    getStyle(highlightState: undefined): { marker: MarkerLike };
};

export function radarMarkerDrawMode(series: RadarLike): _ModuleSupport.MarkerDrawMode {
    // Similar to cartesianMarkerDrawMode.
    const markersEnabled =
        series.properties.styler == null ? series.properties.marker.enabled : series.getStyle(undefined).marker.enabled;
    if (series.properties.selection.enabled) {
        return { needsNodeData: true, hideWithSize0: !markersEnabled };
    } else {
        return { needsNodeData: markersEnabled, hideWithSize0: false };
    }
}
