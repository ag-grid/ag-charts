import { _ModuleSupport } from 'ag-charts-community';

import { BoxPlotSeries } from './boxPlotSeries';
import { BOX_PLOT_SERIES_THEME } from './boxPlotThemes';

const {
    Color,
    swapAxisCondition,
    ThemeSymbols: { DEFAULT_BACKGROUND_COLOUR },
    ThemeConstants: { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION },
} = _ModuleSupport;

export const BoxPlotModule: _ModuleSupport.SeriesModule<'box-plot'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'box-plot',
    moduleFactory: (ctx) => new BoxPlotSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: swapAxisCondition(
        [
            { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
            { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
        ],
        (series) => series?.direction === 'horizontal'
    ),
    themeTemplate: BOX_PLOT_SERIES_THEME,
    groupable: true,

    paletteFactory: ({ takeColors, themeTemplateParameters }) => {
        const themeBackgroundColor = themeTemplateParameters.get(DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill =
            (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) ?? 'white';

        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);

        // @todo(AG-11876) Use fillOpacity to match area, range area, radar area, chord, and sankey series
        let fakeFill: string;
        try {
            fakeFill = Color.mix(Color.fromString(backgroundFill), Color.fromString(fill), 0.3).toString();
        } catch {
            fakeFill = fill;
        }

        return {
            fill: fakeFill,
            stroke,
            backgroundFill,
        };
    },
};
