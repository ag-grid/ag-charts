import { _ModuleSupport, type AgBoxPlotSeriesOptions } from 'ag-charts-community';
import { BOX_PLOT_SERIES_THEME } from './boxPlotThemes';
import { BOX_PLOT_SERIES_DEFAULTS } from './boxPlotDefaults';
import { BoxPlotSeries } from './boxPlotSeries';

const { singleSeriesPaletteFactory } = _ModuleSupport;
export const BoxPlotModule: _ModuleSupport.SeriesModule<'box-plot'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'box-plot',
    instanceConstructor: BoxPlotSeries,
    seriesDefaults: BOX_PLOT_SERIES_DEFAULTS,
    themeTemplate: BOX_PLOT_SERIES_THEME,
    groupable: true,

    paletteFactory: singleSeriesPaletteFactory,

    swapDefaultAxesCondition({ series }) {
        const [{ direction }] = series as [AgBoxPlotSeriesOptions];
        return direction === 'horizontal';
    },
};
