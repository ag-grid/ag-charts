import { _ModuleSupport, _Theme } from 'ag-charts-community';

const BASE_RADAR_SERIES_THEME = {
    series: {
        label: {
            enabled: false,
            fontSize: 12,
            fontFamily: _Theme.DEFAULT_FONT_FAMILY,
            color: _Theme.DEFAULT_LABEL_COLOUR,
        },
        marker: {
            enabled: true,
            fillOpacity: 1,
            shape: 'circle',
            size: 6,
            strokeOpacity: 1,
            strokeWidth: 0,
        },
    },
    axes: {
        [_Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
            label: {
                padding: 10,
            },
        },
    },
};

export const RADAR_LINE_SERIES_THEME = _ModuleSupport.mergeDefaults(
    {
        series: {
            strokeWidth: 2,
        },
    },
    BASE_RADAR_SERIES_THEME
);

export const RADAR_AREA_SERIES_THEME = _ModuleSupport.mergeDefaults(
    {
        series: {
            fillOpacity: 0.8,
            strokeWidth: 2,
            marker: {
                enabled: false,
            },
        },
    },
    BASE_RADAR_SERIES_THEME
);
