import { _ModuleSupport, _Scale, _Theme } from 'ag-charts-community';

import { RangeAreaSeries } from './rangeArea';
import { RANGE_AREA_DEFAULTS } from './rangeAreaDefaults';
import { RANGE_AREA_SERIES_THEME } from './rangeAreaThemes';

const { markerPaletteFactory } = _ModuleSupport;
export const RangeAreaModule: _ModuleSupport.SeriesModule<'range-area'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'range-area',
    instanceConstructor: RangeAreaSeries,
    seriesDefaults: RANGE_AREA_DEFAULTS,
    themeTemplate: RANGE_AREA_SERIES_THEME,

    paletteFactory: (params) => {
        const { marker } = markerPaletteFactory(params);
        return {
            fill: marker.fill,
            stroke: marker.stroke,
            marker,
        };
    },
};
