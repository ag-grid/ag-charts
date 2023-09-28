import { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { POLAR_DEFAULTS } from '../polarDefaults';
import { RadarAreaSeries } from './radarAreaSeries';
import { RADAR_AREA_SERIES_THEME } from './radarAreaThemes';

const { markerPaletteFactory } = _ModuleSupport;

export const RadarAreaModule: _ModuleSupport.SeriesModule<'radar-area'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radar-area',
    instanceConstructor: RadarAreaSeries,
    seriesDefaults: POLAR_DEFAULTS,
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
