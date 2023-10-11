import { type AgBoxPlotSeriesOptions, type _ModuleSupport, _Theme, _Util } from 'ag-charts-community';

import { BOX_PLOT_SERIES_DEFAULTS } from './boxPlotDefaults';
import { BoxPlotSeries } from './boxPlotSeries';
import { BOX_PLOT_SERIES_THEME } from './boxPlotThemes';

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

    paletteFactory: ({ takeColors, userPalette, themeTemplateParameters }) => {
        const themeBackgroundColor = themeTemplateParameters.properties.get(_Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill =
            (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) ?? 'white';

        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);
        return {
            fill: userPalette ? fill : _Util.Color.interpolate(fill, backgroundFill)(0.7),
            stroke,
        };
    },

    swapDefaultAxesCondition({ series }) {
        const [{ direction }] = series as [AgBoxPlotSeriesOptions];
        return direction === 'horizontal';
    },
};
