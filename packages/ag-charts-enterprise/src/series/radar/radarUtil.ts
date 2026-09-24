import { _ModuleSupport } from 'ag-charts-community';

type MarkerLike = {
    enabled: boolean;
};
type RadarLike = {
    options: {
        marker: MarkerLike;
        styler?: Function;
    };
    isSelectionEnabled(): boolean;
    getStyle(highlightState: undefined): { marker: MarkerLike };
};

export function radarMarkerDrawMode(series: RadarLike): _ModuleSupport.MarkerDrawMode {
    // Similar to cartesianMarkerDrawMode.
    const { marker, styler } = series.options;
    const markersEnabled = styler == null ? marker.enabled : series.getStyle(undefined).marker.enabled;
    if (series.isSelectionEnabled()) {
        return { needsNodeData: true, hideWithSize0: !markersEnabled };
    } else {
        return { needsNodeData: markersEnabled, hideWithSize0: false };
    }
}
