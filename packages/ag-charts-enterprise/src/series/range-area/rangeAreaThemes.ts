import { type InteractionRange, _Theme } from 'ag-charts-community';

export const RANGE_AREA_SERIES_THEME = {
    series: {
        __extends__: _Theme.EXTENDS_SERIES_DEFAULTS,
        fillOpacity: 0.7,
        nodeClickRange: 'nearest' as InteractionRange,
        marker: {
            __extends__: _Theme.EXTENDS_CARTESIAN_MARKER_DEFAULTS,
            enabled: false,
            fillOpacity: 1,
            strokeWidth: 2,
            size: 6,
        },
        label: {
            enabled: false,
            placement: 'outside',
            padding: 10,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_LABEL_COLOUR,
            __overrides__: _Theme.OVERRIDE_SERIES_LABEL_DEFAULTS,
        },
    },
    axes: {
        [_Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
    },
};
