import { _ModuleSupport } from 'ag-charts-community';

const {
    ThemeConstants: { POLAR_AXIS_TYPE },
} = _ModuleSupport;

const BASE_RADAR_SERIES_THEME: _ModuleSupport.SeriesModule<'radar-line' | 'radar-area'>['themeTemplate'] = {
    series: {
        stroke: { $palette: 'stroke' },
        label: {
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'textColor' },
        },
        marker: {
            enabled: true,
            fill: { $palette: 'fill' },
            stroke: { $palette: 'stroke' },
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
    _ModuleSupport.mergeDefaults(
        {
            series: {
                stroke: { $palette: 'fill' },
                strokeWidth: 2,
            },
        },
        BASE_RADAR_SERIES_THEME
    );

export const RADAR_AREA_SERIES_THEME: _ModuleSupport.SeriesModule<'radar-area'>['themeTemplate'] =
    _ModuleSupport.mergeDefaults(
        {
            series: {
                fill: { $palette: 'fill' },
                defaultColorRange: { $palette: 'gradient' }, // TODO: update radar-area to handle 'gradients'
                fillOpacity: 0.8,
                strokeWidth: 2,
                marker: {
                    enabled: false,
                    defaultColorRange: { $palette: 'gradient' },
                },
            },
        },
        BASE_RADAR_SERIES_THEME
    );
