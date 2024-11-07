import { _ModuleSupport } from 'ag-charts-community';

import { RADAR_AREA_SERIES_THEME } from '../radar/radarThemes';
import { RadarAreaSeries } from './radarAreaSeries';

const {
    markerPaletteFactory,
    ThemeConstants: { POLAR_AXIS_TYPE },
} = _ModuleSupport;

export const RadarAreaModule: _ModuleSupport.SeriesModule<'radar-area'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radar-area',
    moduleFactory: (ctx) => new RadarAreaSeries(ctx),
    tooltipDefaults: { range: 'nearest' },
    defaultAxes: [{ type: POLAR_AXIS_TYPE.ANGLE_CATEGORY }, { type: POLAR_AXIS_TYPE.RADIUS_NUMBER }],
    themeTemplate: RADAR_AREA_SERIES_THEME,
    paletteFactory: (params) => {
        const { marker } = markerPaletteFactory(params);
        return {
            stroke: marker.stroke,
            fill: marker.fill,
            marker,
        };
    },
};
