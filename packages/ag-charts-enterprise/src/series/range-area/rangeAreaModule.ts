import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { RangeAreaSeries } from './rangeArea';
import { RANGE_AREA_SERIES_THEME } from './rangeAreaThemes';

const { markerPaletteFactory } = _ModuleSupport;
export const RangeAreaModule: _ModuleSupport.SeriesModule<'range-area'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'range-area',
    moduleFactory: (ctx) => new RangeAreaSeries(ctx),
    tooltipDefaults: { range: 'nearest' },
    defaultAxes: [
        {
            type: _Theme.CARTESIAN_AXIS_TYPE.NUMBER,
            position: _Theme.CARTESIAN_POSITION.LEFT,
        },
        {
            type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
            position: _Theme.CARTESIAN_POSITION.BOTTOM,
        },
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
