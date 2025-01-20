import { _ModuleSupport } from 'ag-charts-community';

const {
    ThemeConstants: { POLAR_AXIS_TYPE },
} = _ModuleSupport;

const BASE_RADAR_SERIES_THEME: _ModuleSupport.SeriesModule<'radar-line' | 'radar-area'>['themeTemplate'] = {
    series: {
        label: {
            enabled: false,
            fontSize: { ref: 'fontSize' },
            fontFamily: { ref: 'fontFamily' },
            color: { ref: 'foregroundColor' },
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
        [POLAR_AXIS_TYPE.ANGLE_CATEGORY]: {
            label: {
                spacing: 10,
            },
        },
    },
};

export const RADAR_LINE_SERIES_THEME: _ModuleSupport.SeriesModule<'radar-line'>['themeTemplate'] =
    _ModuleSupport.mergeDefaults({ series: { strokeWidth: 2 } }, BASE_RADAR_SERIES_THEME);

export const RADAR_AREA_SERIES_THEME: _ModuleSupport.SeriesModule<'radar-area'>['themeTemplate'] =
    _ModuleSupport.mergeDefaults(
        {
            series: {
                fillOpacity: 0.8,
                strokeWidth: 2,
                marker: { enabled: false },
            },
        },
        BASE_RADAR_SERIES_THEME
    );
