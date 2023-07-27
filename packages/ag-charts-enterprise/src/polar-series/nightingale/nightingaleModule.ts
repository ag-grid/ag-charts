import type { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { POLAR_DEFAULTS } from '../polarDefaults';
import { NightingaleSeries } from './nightingaleSeries';

export const NightingaleModule: _ModuleSupport.SeriesModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'nightingale',
    instanceConstructor: NightingaleSeries,
    seriesDefaults: POLAR_DEFAULTS,
    themeTemplate: {},
    paletteFactory: ({ takeColors }) => {
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);
        return {
            fill,
            stroke,
        };
    },
    stackable: true,
    groupable: true,
};
