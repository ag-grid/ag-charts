import { _ModuleSupport } from 'ag-charts-community';

import { RangeAreaSeries } from './rangeArea';
import { RANGE_AREA_SERIES_THEME } from './rangeAreaThemes';

const {
    markerPaletteFactory,
    ThemeConstants: { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION },
} = _ModuleSupport;

export const RangeAreaModule: _ModuleSupport.SeriesModule<'range-area'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'range-area',
    moduleFactory: (ctx) => new RangeAreaSeries(ctx),
    tooltipDefaults: { range: 'nearest' },
    defaultAxes: [
        { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
        { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
    ],
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
