import { _ModuleSupport } from 'ag-charts-community';

import { HeatmapSeries } from './heatmapSeries';
import { HEATMAP_SERIES_THEME } from './heatmapThemes';

const {
    ThemeSymbols: { DEFAULT_DIVERGING_SERIES_COLOR_RANGE, DEFAULT_BACKGROUND_COLOUR },
    ThemeConstants: { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION },
} = _ModuleSupport;

export const HeatmapModule: _ModuleSupport.SeriesModule<'heatmap'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'heatmap',
    moduleFactory: (ctx) => new HeatmapSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [
        { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.LEFT },
        { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
    ],
    themeTemplate: HEATMAP_SERIES_THEME,
    paletteFactory: ({ takeColors, colorsCount, userPalette, themeTemplateParameters }) => {
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_DIVERGING_SERIES_COLOR_RANGE);
        const defaultBackgroundColor = themeTemplateParameters.get(DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill =
            (Array.isArray(defaultBackgroundColor) ? defaultBackgroundColor[0] : defaultBackgroundColor) ?? 'white';
        const { fills, strokes } = takeColors(colorsCount);
        return {
            stroke: userPalette === 'inbuilt' ? backgroundFill : strokes[0],
            colorRange: userPalette === 'inbuilt' ? defaultColorRange : [fills[0], fills[1]],
        };
    },
};
