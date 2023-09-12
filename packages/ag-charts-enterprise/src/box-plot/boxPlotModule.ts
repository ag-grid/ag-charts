import type { _ModuleSupport, AgBoxPlotSeriesOptions } from 'ag-charts-community';
import { BOX_PLOT_SERIES_THEME } from './boxPlotThemes';
import { BOX_PLOT_SERIES_DEFAULTS } from './boxPlotDefaults';
import { BoxPlotSeries } from './boxPlotSeries';

export const BoxPlotModule: _ModuleSupport.SeriesModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'box-plot',
    instanceConstructor: BoxPlotSeries,
    seriesDefaults: BOX_PLOT_SERIES_DEFAULTS,
    themeTemplate: BOX_PLOT_SERIES_THEME,
    groupable: true,

    paletteFactory: ({ takeColors }) => {
        const {
            fills: [fill],
        } = takeColors(1);
        return { fill };
    },

    swapDefaultAxesCondition({ series }) {
        const [{ direction }] = series as [AgBoxPlotSeriesOptions];
        return direction === 'vertical';
    },
};
