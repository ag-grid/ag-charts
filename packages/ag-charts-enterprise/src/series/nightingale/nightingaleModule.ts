import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

import { NightingaleSeries } from './nightingaleSeries';
import { NIGHTINGALE_SERIES_THEME } from './nightingaleThemes';

export const NightingaleModule: _ModuleSupport.SeriesModule<'nightingale'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'nightingale',
    instanceConstructor: NightingaleSeries,
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [
        {
            type: _Theme.POLAR_AXIS_TYPE.ANGLE_CATEGORY,
        },
        {
            type: _Theme.POLAR_AXIS_TYPE.RADIUS_NUMBER,
        },
    ],
    themeTemplate: NIGHTINGALE_SERIES_THEME,
    paletteFactory({ takeColors, userPalette }) {
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);
        return {
            fill,
            stroke: userPalette ? stroke : _Theme.DEFAULT_POLAR_SERIES_STROKE,
        };
    },
    stackable: true,
    groupable: true,
    stackedByDefault: true,
};
