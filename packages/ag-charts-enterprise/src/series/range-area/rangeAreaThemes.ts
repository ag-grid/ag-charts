import { type InteractionRange, _Theme } from 'ag-charts-community';

export const RANGE_AREA_SERIES_THEME = {
    series: {
        fillOpacity: 0.7,
        nodeClickRange: 'nearest' as InteractionRange,
        marker: {
            enabled: false,
            size: 6,
            strokeWidth: 2,
        },
        label: {
            enabled: false,
            placement: 'outside',
            padding: 10,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_LABEL_COLOUR,
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
