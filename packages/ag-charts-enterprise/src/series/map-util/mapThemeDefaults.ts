import type { _ModuleSupport } from 'ag-charts-community';

export const MAP_THEME_DEFAULTS: _ModuleSupport.ExtensibleTheme<'map-shape' | 'map-line' | 'map-marker'> = {
    zoom: {
        axes: 'xy',
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
    },
    legend: {
        enabled: false,
    },
    gradientLegend: {
        enabled: false,
    },
    tooltip: {
        range: 'exact',
    },
};
