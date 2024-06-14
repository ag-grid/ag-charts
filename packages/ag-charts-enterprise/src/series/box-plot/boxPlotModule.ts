import { type _ModuleSupport, _Theme, _Util } from 'ag-charts-community';

import { BoxPlotSeries } from './boxPlotSeries';
import { BOX_PLOT_SERIES_THEME } from './boxPlotThemes';

export const BoxPlotModule: _ModuleSupport.SeriesModule<'box-plot'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'box-plot',
    instanceConstructor: BoxPlotSeries,
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [
        {
            type: _Theme.CARTESIAN_AXIS_TYPE.NUMBER,
            position: _Theme.POSITION.LEFT,
        },
        {
            type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
            position: _Theme.POSITION.BOTTOM,
        },
    ],
    themeTemplate: BOX_PLOT_SERIES_THEME,
    groupable: true,

    paletteFactory: ({ takeColors, themeTemplateParameters }) => {
        const themeBackgroundColor = themeTemplateParameters.get(_Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill =
            (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) ?? 'white';

        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);
        return {
            fill,
            stroke,
            backgroundFill,
        };
    },

    swapDefaultAxesCondition: ({ direction }) => direction === 'horizontal',
};
